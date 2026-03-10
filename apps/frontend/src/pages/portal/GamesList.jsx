import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import publicApi from '../../lib/publicApi';
import { useCustomerStore } from '../../store/customerStore';
import { OrgContext } from './GamePortal';

const GAME_ICONS = { spin_wheel: '🎡', scratch_card: '🃏', catch_popcorn: '🍿' };

function getDynamicRules(gameKey, gameConfig = {}, staticRules = []) {
  if (gameKey === 'catch_popcorn') {
    const threshold = gameConfig.winThreshold ?? 10;
    const totalSecs = gameConfig.durationSeconds ?? 20;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const durationLabel = mins > 0
      ? `${mins} min${mins > 1 ? 's' : ''}${secs > 0 ? ` ${secs} sec` : ''}`
      : `${secs} seconds`;
    return [
      'Drag the bucket left and right to catch falling popcorn.',
      'Normal popcorn: +1 point. Golden popcorn: +3 points. Burnt popcorn: −1 point.',
      `Catch at least ${threshold} popcorns to win a reward.`,
      `Game lasts ${durationLabel}. Speed increases as time goes on!`,
    ];
  }
  return staticRules;
}

// ── Game Detail Bottom Sheet Dialog ─────────────────────────────────────────
function GameDialog({ orgGame, orgSlug, token, onClose, onStart }) {
  const game       = orgGame.gameId;
  const gameConfig = orgGame.gameConfig || {};
  const gameIcon   = GAME_ICONS[game.key] || '🎮';
  const rules      = getDynamicRules(game.key, gameConfig, game.rules || []);

  const showChips = game.key === 'catch_popcorn';
  const threshold = gameConfig.winThreshold   ?? 10;
  const totalSecs = gameConfig.durationSeconds ?? 20;
  const mins      = Math.floor(totalSecs / 60);
  const secs      = totalSecs % 60;
  const durationLabel = mins > 0 ? `${mins}m${secs > 0 ? ` ${secs}s` : ''}` : `${secs}s`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp 0.25s ease' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-6 text-center relative"
          style={{ background: 'linear-gradient(135deg, var(--brand-btn, #6366f1), var(--brand-btn2, #8b5cf6))' }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-sm font-bold"
          >✕</button>
          <div className="text-5xl mb-2">{gameIcon}</div>
          <h2 className="text-lg font-bold text-white">{game.name}</h2>
          <p className="text-white/80 text-xs mt-1">{game.shortDescription}</p>
          {showChips && (
            <div className="flex justify-center gap-2 mt-3">
              <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                🍿 Catch {threshold} to win
              </span>
              <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                ⏱ {durationLabel}
              </span>
            </div>
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* Rewards */}
          {orgGame.assignedOffers?.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-2">🎁 Possible Rewards</h3>
              <div className="space-y-2">
                {orgGame.assignedOffers.map(o => (
                  <div key={o._id} className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                    <span className="text-xl">🏷️</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{o.name}</p>
                      <p className="text-xs text-purple-600 font-medium">
                        {o.discountType === 'percentage' ? `${o.discountValue}% off` : `₹${o.discountValue} off`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules */}
          {rules.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-2">📝 Game Rules</h3>
              <ul className="space-y-2">
                {rules.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold flex-shrink-0 text-[10px] mt-0.5">
                      {i + 1}
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Timer */}
          {orgGame.timerMinutes > 0 && (
            <div className="p-3 bg-orange-50 rounded-xl text-center">
              <p className="text-xs text-orange-600">⏱ You have <strong>{orgGame.timerMinutes} minutes</strong> to complete the game</p>
            </div>
          )}

          {/* Login hint for guests */}
          {!token && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-center">
              <p className="text-xs text-blue-600 font-medium">🔑 You’ll be asked to verify your WhatsApp number before the game starts</p>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={onStart}
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm"
            style={{ background: 'var(--brand-btn, #6366f1)' }}
          >
            {token ? `${gameIcon} Start Game!` : '🔑 Login & Play'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Main Games List ──────────────────────────────────────────────────────────
export default function GamesList() {
  const { orgSlug }  = useParams();
  const orgData      = useContext(OrgContext);
  const { token, customer } = useCustomerStore();
  const navigate     = useNavigate();
  const [games, setGames]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (orgData?.org?.id) {
      publicApi.get(`/games/${orgData.org.id}`)
        .then(r => setGames(r.data))
        .finally(() => setLoading(false));
    }
  }, [orgData]);

  const handleStartFromDialog = (orgGame) => {
    if (!token) {
      navigate(`/play/${orgSlug}/login`, {
        state: { returnTo: `/play/${orgSlug}/start/${orgGame._id}` }
      });
    } else {
      navigate(`/play/${orgSlug}/start/${orgGame._id}`);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">

      {/* Welcome */}
      <div className="text-center mb-6">
        {customer ? (
          <div>
            <p className="text-white text-lg font-bold">Hey {customer.name}! 👋</p>
            <p className="text-white/70 text-sm mt-1">Ready to win amazing rewards?</p>
          </div>
        ) : (
          <div>
            <p className="text-white text-xl font-bold">Play & Win! 🎉</p>
            <p className="text-white/70 text-sm mt-1">Browse games below and tap View to see offers & rules</p>
          </div>
        )}
      </div>

      {/* Top actions */}
      <div className="flex gap-2 mb-6">
        {token ? (
          <Link to={`/play/${orgSlug}/dashboard`}
            className="flex-1 text-center py-2.5 rounded-xl font-medium text-sm bg-white/20 text-white hover:bg-white/30 transition-colors">
            📊 My Rewards
          </Link>
        ) : (
          <Link to={`/play/${orgSlug}/login`}
            className="flex-1 text-center py-2.5 rounded-xl font-semibold text-white text-sm"
            style={{ background: 'var(--brand-btn, #6366f1)' }}>
            🔑 Login to Play
          </Link>
        )}
      </div>

      {/* Game Cards */}
      {loading ? (
        <div className="text-center text-white/70 py-8">⏳ Loading games...</div>
      ) : games.length === 0 ? (
        <div className="text-center bg-white/10 rounded-2xl p-8">
          <p className="text-white text-4xl mb-2">🎮</p>
          <p className="text-white font-semibold">No games available yet</p>
          <p className="text-white/60 text-sm mt-1">Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {games.map(orgGame => {
            const icon   = GAME_ICONS[orgGame.gameId?.key] || '🎮';
            const offers = orgGame.assignedOffers || [];
            return (
              <div key={orgGame._id} className="bg-white rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center text-3xl flex-shrink-0">
                    {orgGame.gameId?.imageUrl
                      ? <img src={orgGame.gameId.imageUrl} className="w-full h-full object-cover rounded-xl" alt="" />
                      : icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm">{orgGame.gameId?.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{orgGame.gameId?.shortDescription}</p>
                    {offers.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {offers.slice(0, 2).map(o => (
                          <span key={o._id} className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">
                            {o.discountType === 'percentage' ? `${o.discountValue}% off` : `₹${o.discountValue} off`}
                          </span>
                        ))}
                        {offers.length > 2 && (
                          <span className="text-[10px] text-gray-400">+{offers.length - 2} more</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card button:
                      - Guest  → "View"       (outline) opens dialog
                      - LoggedIn → "▶ Play"   (filled)  goes directly to /start
                  */}
                  {token ? (
                    <button
                      onClick={() => navigate(`/play/${orgSlug}/start/${orgGame._id}`)}
                      className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold text-white"
                      style={{ background: 'var(--brand-btn, #6366f1)' }}>
                      {icon} Play
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelected(orgGame)}
                      className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border-2 text-purple-600 border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors">
                      View
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Game Detail Dialog (guests only, but keeps working if somehow opened while logged in) */}
      {selected && (
        <GameDialog
          orgGame={selected}
          orgSlug={orgSlug}
          token={token}
          onClose={() => setSelected(null)}
          onStart={() => { setSelected(null); handleStartFromDialog(selected); }}
        />
      )}
    </div>
  );
}
