import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import publicApi from '../../lib/publicApi';
import { OrgContext } from './GamePortal';

export default function GameStart() {
  const { orgSlug, orgGameId } = useParams();
  const orgData = useContext(OrgContext);
  const navigate = useNavigate();
  const [orgGame, setOrgGame] = useState(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    publicApi.get(`/games/${orgData?.org?.id}`).then(r => {
      const g = r.data.find(og => og._id === orgGameId);
      setOrgGame(g);
    });
  }, [orgGameId]);

  const handleStart = async () => {
    setStarting(true);
    try {
      const { data: session } = await publicApi.post('/game/start', { orgGameId });
      const key = orgGame?.gameId?.key;
      if (key === 'spin_wheel')     navigate(`/play/${orgSlug}/play/spin/${session._id}`);
      else if (key === 'scratch_card') navigate(`/play/${orgSlug}/play/scratch/${session._id}`);
      else if (key === 'catch_popcorn') navigate(`/play/${orgSlug}/play/popcorn/${session._id}`);
      else toast.error('Game type not supported yet');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot start game');
      setStarting(false);
    }
  };

  if (!orgGame) return <div className="text-center text-white py-12">⏳ Loading...</div>;

  const game = orgGame.gameId;
  const gameIcon = { spin_wheel: '🎡', scratch_card: '🃏', catch_popcorn: '🍿' }[game.key] || '🎮';

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 text-center" style={{ background: 'linear-gradient(135deg, var(--brand-btn, #6366f1), var(--brand-btn2, #8b5cf6))' }}>
          <div className="text-5xl mb-3">{gameIcon}</div>
          <h2 className="text-xl font-bold text-white">{game.name}</h2>
          <p className="text-white/80 text-sm mt-1">{game.shortDescription}</p>
        </div>

        <div className="p-5">
          {/* Rewards Preview */}
          {orgGame.assignedOffers?.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">🎁 Possible Rewards</h3>
              <div className="space-y-2">
                {orgGame.assignedOffers.map(o => (
                  <div key={o._id} className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                    <span className="text-lg">🏷️</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{o.name}</p>
                      <p className="text-xs text-purple-600">
                        {o.discountType === 'percentage' ? `${o.discountValue}% off` : `₹${o.discountValue} off`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules */}
          {game.rules?.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">📝 Game Rules</h3>
              <ul className="space-y-1.5">
                {game.rules.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">{i + 1}</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {orgGame.timerMinutes > 0 && (
            <div className="mb-4 p-3 bg-orange-50 rounded-xl text-center">
              <p className="text-xs text-orange-600">⏱ You have <strong>{orgGame.timerMinutes} minutes</strong> to complete the game</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => navigate(-1)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">← Back</button>
            <button onClick={handleStart} disabled={starting} className="flex-1 py-3 rounded-xl text-white font-bold text-sm" style={{ background: 'var(--brand-btn, #6366f1)' }}>
              {starting ? 'Starting...' : `${gameIcon} Start Game!`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
