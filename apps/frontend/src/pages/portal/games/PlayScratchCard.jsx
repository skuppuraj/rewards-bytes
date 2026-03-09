import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import publicApi from '../../../lib/publicApi';

export default function PlayScratchCard() {
  const { orgSlug, sessionId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [scratched, setScratched] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [prize] = useState('🎁 You Won!');

  const W = 300, H = 200;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    // Draw scratch overlay
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#6366f1');
    grad.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = grad;
    ctx.roundRect(0, 0, W, H, 16);
    ctx.fill();
    // Scratch instruction text
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💆 Scratch Here!', W/2, H/2 - 5);
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Use your finger or mouse', W/2, H/2 + 18);
  }, []);

  const getPos = (canvas, e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const scratch = (e) => {
    e.preventDefault();
    if (!isDrawing || revealed) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(canvas, e);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 22, 0, 2 * Math.PI);
    ctx.fill();
    // Check scratch %
    const imgData = ctx.getImageData(0, 0, W, H);
    let transparent = 0;
    for (let i = 3; i < imgData.data.length; i += 4) {
      if (imgData.data[i] < 128) transparent++;
    }
    const pct = (transparent / (W * H)) * 100;
    setScratched(Math.round(pct));
    if (pct > 60 && !revealed) {
      setRevealed(true);
      // Clear canvas fully
      ctx.clearRect(0, 0, W, H);
    }
  };

  const handleFinish = async () => {
    try {
      await publicApi.post('/game/complete', { sessionId, result: { won: true, type: 'scratch_card' } });
      navigate(`/play/${orgSlug}/complete/${sessionId}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error completing game');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-60px)] p-4">
      <div className="text-center mb-5">
        <h2 className="text-white text-xl font-bold">🃏 Scratch Card</h2>
        <p className="text-white/70 text-sm">Scratch to reveal your prize!</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-2xl">
        {/* Prize hidden below */}
        <div className="relative" style={{width: W, height: H}}>
          {/* Prize (shown below canvas) */}
          <div className="absolute inset-0 rounded-2xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #fef3c7, #fde68a)'}}>
            <div className="text-center">
              <p className="text-4xl mb-1">🎁</p>
              <p className="font-bold text-gray-800 text-lg">You Won!</p>
              <p className="text-sm text-yellow-600">Claim your reward below</p>
            </div>
          </div>
          {/* Scratch canvas on top */}
          <canvas
            ref={canvasRef}
            width={W} height={H}
            className="absolute inset-0 rounded-2xl cursor-crosshair"
            style={{touchAction: 'none'}}
            onMouseDown={() => setIsDrawing(true)}
            onMouseUp={() => setIsDrawing(false)}
            onMouseMove={scratch}
            onTouchStart={() => setIsDrawing(true)}
            onTouchEnd={() => setIsDrawing(false)}
            onTouchMove={scratch}
          />
        </div>

        {scratched > 0 && (
          <div className="mt-3">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-400 rounded-full transition-all" style={{width: `${Math.min(scratched, 100)}%`}} />
            </div>
            <p className="text-xs text-gray-400 text-center mt-1">{scratched}% scratched</p>
          </div>
        )}
      </div>

      {revealed && (
        <div className="mt-5 text-center">
          <p className="text-white text-lg font-bold mb-3">🎉 Congratulations!</p>
          <button onClick={handleFinish} className="px-8 py-3 rounded-xl text-white font-bold shadow-xl" style={{background: 'var(--brand-btn, #6366f1)'}}>
            🎁 Claim Reward!
          </button>
        </div>
      )}
    </div>
  );
}
