import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Trophy, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';

const DEFAULT_SEGMENTS = [
  { label: '10 pts', points: 10, color: '#6366f1' },
  { label: '25 pts', points: 25, color: '#8b5cf6' },
  { label: '5 pts',  points: 5,  color: '#a78bfa' },
  { label: '50 pts', points: 50, color: '#7c3aed' },
  { label: '15 pts', points: 15, color: '#4f46e5' },
  { label: 'Try Again', points: 0, color: '#c4b5fd' },
  { label: '30 pts', points: 30, color: '#5b21b6' },
  { label: '20 pts', points: 20, color: '#ddd6fe' },
];

export default function SpinWheel() {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const playerId = searchParams.get('player');
  const canvasRef = useRef(null);
  const spinRef = useRef({ angle: 0, velocity: 0, spinning: false });
  const [game, setGame] = useState(null);
  const [segments, setSegments] = useState(DEFAULT_SEGMENTS);
  const [result, setResult] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playerIdInput, setPlayerIdInput] = useState(playerId || '');
  const [phase, setPhase] = useState(playerId ? 'ready' : 'enter_player');

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const { data } = await api.get(`/games/${gameId}`);
        setGame(data);
        if (data.config?.segments?.length) setSegments(data.config.segments);
      } catch {}
      finally { setLoading(false); }
    };
    fetchGame();
  }, [gameId]);

  useEffect(() => { drawWheel(spinRef.current.angle); }, [segments]);

  const drawWheel = (angle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) / 2 - 10;
    const arc = (2 * Math.PI) / segments.length;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.shadowColor = '#6366f1'; ctx.shadowBlur = 24;
    ctx.beginPath(); ctx.arc(cx, cy, R + 6, 0, 2 * Math.PI);
    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 4; ctx.stroke();
    ctx.restore();
    segments.forEach((seg, i) => {
      const startAngle = angle + i * arc, endAngle = startAngle + arc;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, startAngle, endAngle); ctx.closePath();
      ctx.fillStyle = seg.color || '#6366f1'; ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = 'right'; ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 4;
      ctx.fillText(seg.label, R - 12, 5); ctx.restore();
    });
    ctx.beginPath(); ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 3; ctx.stroke();
    ctx.font = '18px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🏆', cx, cy);
    ctx.beginPath(); ctx.moveTo(cx - 12, 4); ctx.lineTo(cx + 12, 4); ctx.lineTo(cx, 28); ctx.closePath();
    ctx.fillStyle = '#6366f1'; ctx.shadowColor = '#6366f1'; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0;
  };

  const animate = () => {
    const s = spinRef.current;
    if (!s.spinning) return;
    s.angle += s.velocity;
    s.velocity *= 0.985;
    drawWheel(s.angle);
    if (s.velocity < 0.002) {
      s.spinning = false; setSpinning(false); resolveResult(s.angle);
    } else { requestAnimationFrame(animate); }
  };

  const resolveResult = (angle) => {
    const arc = (2 * Math.PI) / segments.length;
    const normalized = (((-angle % (2 * Math.PI)) + 2 * Math.PI + Math.PI / 2) % (2 * Math.PI));
    const index = Math.floor(normalized / arc) % segments.length;
    const seg = segments[index];
    setResult(seg);
    if (playerIdInput) api.post(`/games/${gameId}/play`, { playerId: playerIdInput }).catch(() => {});
  };

  const handleSpin = () => {
    if (spinning) return;
    setResult(null);
    const s = spinRef.current;
    s.velocity = 0.25 + Math.random() * 0.2;
    s.spinning = true; setSpinning(true);
    requestAnimationFrame(animate);
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-white" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-3">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="text-white text-sm font-medium">Rewards Bytes</span>
        </div>
        <h1 className="text-3xl font-bold text-white">{game?.name || 'Lucky Spin'}</h1>
        <p className="text-indigo-200 text-sm mt-1">Spin the wheel and win points!</p>
      </div>

      {phase === 'enter_player' && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 w-full max-w-sm border border-white/20">
          <h2 className="text-white font-semibold mb-4 text-center">Enter your Player ID</h2>
          <Input placeholder="Your Player ID" value={playerIdInput} onChange={e => setPlayerIdInput(e.target.value)}
            className="bg-white/20 border-white/30 text-white placeholder:text-white/50 mb-4" />
          <Button className="w-full bg-white text-indigo-700 hover:bg-white/90 font-semibold"
            onClick={() => setPhase('ready')} disabled={!playerIdInput}>Let's Spin!</Button>
        </div>
      )}

      {phase === 'ready' && (
        <>
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-3xl scale-90" />
            <canvas ref={canvasRef} width={320} height={320} className="relative z-10 drop-shadow-2xl" />
          </div>
          {result && (
            <div className={`mt-6 px-8 py-4 rounded-2xl text-center ${ result.points > 0 ? 'bg-green-500/20 border border-green-400/40' : 'bg-white/10 border border-white/20' }`}>
              {result.points > 0 ? (
                <><p className="text-green-300 text-sm font-medium">🎉 You won!</p><p className="text-4xl font-black text-white mt-1">{result.points} pts</p></>
              ) : (
                <><p className="text-white/70 text-sm">Better luck next time!</p><p className="text-2xl font-bold text-white mt-1">Try Again</p></>
              )}
            </div>
          )}
          <div className="mt-6">
            {!result ? (
              <Button onClick={handleSpin} disabled={spinning}
                className="bg-white text-indigo-700 hover:bg-white/90 font-bold text-lg px-10 py-6 rounded-2xl shadow-xl">
                {spinning ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Spinning...</> : '🎡 SPIN!'}
              </Button>
            ) : (
              <Button onClick={() => setResult(null)}
                className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-4 rounded-2xl border border-white/30">
                <RotateCcw className="w-4 h-4 mr-2" /> Spin Again
              </Button>
            )}
          </div>
          {playerIdInput && <p className="mt-4 text-indigo-300 text-xs">Playing as: <span className="font-mono text-white">{playerIdInput.slice(0, 12)}...</span></p>}
        </>
      )}
    </div>
  );
}
