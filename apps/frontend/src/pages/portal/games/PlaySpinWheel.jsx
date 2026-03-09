import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import publicApi from '../../../lib/publicApi';

export default function PlaySpinWheel() {
  const { orgSlug, sessionId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [angle, setAngle] = useState(0);
  const [segments] = useState(['WIN', 'TRY', 'WIN', '🎁', 'WIN', 'TRY', '🎉', 'WIN']);
  const [timeLeft, setTimeLeft] = useState(null);
  const spinRef = useRef({ current: 0, velocity: 0, animId: null });

  const COLORS = ['#6366f1','#8b5cf6','#a78bfa','#7c3aed','#4f46e5','#818cf8','#c4b5fd','#5b21b6'];
  const SIZE = 280;
  const CENTER = SIZE / 2;
  const RADIUS = CENTER - 10;

  const drawWheel = (currentAngle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const total = segments.length;
    const arc = (2 * Math.PI) / total;
    ctx.clearRect(0, 0, SIZE, SIZE);

    segments.forEach((seg, i) => {
      const start = currentAngle + i * arc;
      const end = start + arc;
      ctx.beginPath();
      ctx.moveTo(CENTER, CENTER);
      ctx.arc(CENTER, CENTER, RADIUS, start, end);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(CENTER, CENTER);
      ctx.rotate(start + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      ctx.fillText(seg, RADIUS - 10, 5);
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, 18, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.fillStyle = '#6366f1';
    ctx.font = 'bold 10px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('SPIN', CENTER, CENTER + 4);
  };

  useEffect(() => { drawWheel(0); }, []);

  const spin = () => {
    if (spinning || result) return;
    setSpinning(true);
    const minSpins = 5;
    const extraAngle = Math.random() * 2 * Math.PI;
    const totalRotation = minSpins * 2 * Math.PI + extraAngle;
    let current = 0;
    let startTime = null;
    const duration = 4000;

    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      current = totalRotation * easeOut(progress);
      drawWheel(current);

      if (progress < 1) {
        spinRef.current.animId = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        const finalAngle = current % (2 * Math.PI);
        const arc = (2 * Math.PI) / segments.length;
        // Pointer is at top (3pi/2), determine segment
        const pointerAngle = (3 * Math.PI / 2 - finalAngle + 2 * Math.PI) % (2 * Math.PI);
        const segIndex = Math.floor(pointerAngle / arc) % segments.length;
        const won = segments[segIndex].includes('🎁') || segments[segIndex].includes('🎉') || segments[segIndex] === 'WIN';
        setResult({ won, segIndex, label: segments[segIndex] });
      }
    };
    requestAnimationFrame(animate);
  };

  const handleFinish = async () => {
    try {
      await publicApi.post('/game/complete', { sessionId, result: { won: result?.won, segment: result?.label } });
      navigate(`/play/${orgSlug}/complete/${sessionId}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error completing game');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-60px)] p-4">
      <div className="text-center mb-4">
        <h2 className="text-white text-xl font-bold">🎡 Spin the Wheel!</h2>
        <p className="text-white/70 text-sm">Tap SPIN to try your luck</p>
      </div>

      {/* Wheel Container */}
      <div className="relative mb-6">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
          <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[20px] border-l-transparent border-r-transparent border-b-yellow-400 drop-shadow-lg"></div>
        </div>
        <canvas ref={canvasRef} width={SIZE} height={SIZE} className="rounded-full shadow-2xl cursor-pointer" onClick={spin} />
      </div>

      {!result ? (
        <button onClick={spin} disabled={spinning}
          className="px-10 py-4 rounded-2xl text-white font-bold text-lg shadow-xl transition-transform active:scale-95"
          style={{background: spinning ? '#9ca3af' : 'var(--brand-btn, #6366f1)'}}>
          {spinning ? '🔄 Spinning...' : '⚡ SPIN!'}
        </button>
      ) : (
        <div className="text-center">
          <div className="bg-white rounded-2xl p-5 shadow-xl mb-4 min-w-[200px]">
            <p className="text-4xl mb-2">{result.won ? '🎉' : '😕'}</p>
            <p className="font-bold text-gray-900 text-lg">{result.won ? 'You Won!' : 'Better Luck Next Time'}</p>
            <p className="text-sm text-gray-500 mt-1">{result.label}</p>
          </div>
          <button onClick={handleFinish} className="px-8 py-3 rounded-xl text-white font-bold" style={{background: 'var(--brand-btn, #6366f1)'}}>
            {result.won ? '🎁 Claim Reward!' : 'Continue →'}
          </button>
        </div>
      )}
    </div>
  );
}
