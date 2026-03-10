import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import publicApi from '../../lib/publicApi';
import { useCustomerStore } from '../../store/customerStore';
import { OrgContext } from './GamePortal';

const GAME_ICONS = { spin_wheel: '🎡', scratch_card: '🃏', catch_popcorn: '🍿' };

const CATEGORIES = [
  { id: 'all',    label: 'All Games', emoji: '🎮' },
  { id: 'arcade', label: 'Arcade',    emoji: '🕹️', keys: ['catch_popcorn'] },
  { id: 'lucky',  label: 'Lucky',     emoji: '🍀', keys: ['spin_wheel', 'scratch_card'] },
];

function getCategory(gameKey) {
  return CATEGORIES.find(c => c.keys?.includes(gameKey))?.id || 'lucky';
}

function getDynamicRules(gameKey, gameConfig = {}, staticRules = []) {
  if (gameKey === 'catch_popcorn') {
    const threshold  = gameConfig.winThreshold  ?? 10;
    const totalSecs  = gameConfig.durationSeconds ?? 20;
    const maxTries   = gameConfig.maxTries ?? 1;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const durationLabel = mins > 0
      ? `${mins} min${mins > 1 ? 's' : ''}${secs > 0 ? ` ${secs} sec` : ''}`
      : `${secs} seconds`;
    const rules = [
      'Drag the bucket left and right to catch falling popcorn.',
      'Normal popcorn: +1 point. Golden popcorn: +3 points. Burnt popcorn: −1 point.',
      `Catch at least ${threshold} popcorns to win a reward.`,
      `Game lasts ${durationLabel}. Speed increases as time goes on!`,
    ];
    if (maxTries > 1) {
      rules.push(`🔄 You get ${maxTries} attempts. If you don't win, tap "Try Again" after each round. Your best score counts!`);
    }
    return rules;
  }
  return staticRules;
}

// ── Config Info Chips ──────────────────────────────────────────────────
function ConfigChips({ gameKey, gameConfig, timerMinutes }) {
  if (gameKey === 'catch_popcorn') {
    const threshold = gameConfig.winThreshold   ?? 10;
    const totalSecs = gameConfig.durationSeconds ?? 20;
    const maxTries  = gameConfig.maxTries ?? 1;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const durationLabel = mins > 0 ? `${mins}m${secs > 0 ? ` ${secs}s` : ''}` : `${secs}s`;
    return (
      <div className="flex justify-center gap-2 mt-3 flex-wrap">
        <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
          🍿 Catch {threshold} to win
        </span>
        <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
          ⏱ {durationLabel}
        </span>
        {maxTries > 1 && (
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
            🔄 {maxTries} tries
          </span>
        )}
        {timerMinutes > 0 && (
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
            ⚠️ {timerMinutes}min limit
          </span>
        )}
      </div>
    );
  }
  if (gameKey === 'spin_wheel' || gameKey === 'scratch_card') {
    return (
      <div className="flex justify-center gap-2 mt-3 flex-wrap">
        {timerMinutes > 0 && (
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
            ⏱ {timerMinutes}min to complete
          </span>
        )}
        {gameConfig.maxPlaysPerCustomer > 0 && (
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
            🔄 {gameConfig.maxPlaysPerCustomer}x plays allowed
          </span>
        )}
      </div>
    );
  }
  return null;
}

// ── Game Detail Bottom Sheet Dialog ────────────────────────────────────────────
function GameDialog({ orgGame, orgSlug, token, onClose, onStart }) {
  const game       = orgGame.gameId;
  const gameConfig = orgGame.gameConfig || {};
  const gameIcon   = GAME_ICONS[game.key] || '🎮';
  const rules      = getDynamicRules(game.key, gameConfig, game.rules || []);
  const catId      = getCategory(game.key);
  const cat        = CATEGORIES.find(c => c.id === catId);
  const maxTries   = gameConfig.maxTries ?? 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl"
        style={{ maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp 0.25s ease' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Gradient header */}
        <div
          className="p-6 text-center relative"
          style={{ background: 'linear-gradient(135deg, var(--brand-btn, #6366f1), var(--brand-btn2, #8b5cf6))' }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-sm font-bold"
          >✕</button>
          {cat && cat.id !== 'all' && (
            <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 uppercase tracking-wide">
              {cat.emoji} {cat.label}
            </span>
          )}
          <div className="text-5xl mb-2">{gameIcon}</div>
          <h2 className="text-lg font-bold text-white">{game.name}</h2>
          <p className="text-white/80 text-xs mt-1">{game.shortDescription}</p>
          <ConfigChips gameKey={game.key} gameConfig={gameConfig} timerMinutes={orgGame.timerMinutes} />
        </div>

        <div className="p-5 space-y-4">

          {/* Try Again notice — prominent banner when enabled */}
          {game.key === 'catch_popcorn' && maxTries > 1 && (
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
              <span className="text-xl flex-shrink-0">🔄</span>
              <div>
                <p className="text-sm font-bold text-green-800">You get {maxTries} attempts!</p>
                <p className="text-xs text-green-600 mt-0.5">
                  If you don't win in one try, tap <strong>"Try Again"</strong> on the game-over screen.
                  Your <strong>best score</strong> across all attempts is what counts for rewards.
                </p>
              </div>
            </div>
          )}

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
                      {o.description && <p className="text-[10px] text-gray-400 mt-0.5">{o.description}</p>}
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

          {/* Login hint */}
          {!token && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-center">
              <p className="text-xs text-blue-600 font-medium">🔑 You'll be asked to verify your WhatsApp number before the game starts</p>
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

// ── Main Games List ─────────────────────────────────────────────────────────────────
export default function GamesList() {
  const { orgSlug }  = useParams();
  const orgData      = useContext(OrgContext);
  const { token, customer } = useCustomerStore();
  const navigate     = useNavigate();

  const [games, setGames]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [search, setSearch]       = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    if (orgData?.org?.id) {
      publicApi.get(`/games/${orgData.org.id}`)
        .then(r => setGames(r.data))
        .finally(() => setLoading(false));
    }
  }, [orgData]);

  const handleStartFromDialog = (orgGame) => {
    if (!token) {
      navigate(`/play/${orgSlug}/login`, { state: { returnTo: `/play/${orgSlug}/start/${orgGame._id}` } });
    } else {
      navigate(`/play/${orgSlug}/start/${orgGame._id}`);
    }
  };

  const filtered = games.filter(og => {
    const matchSearch = !search ||
      og.gameId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      og.gameId?.shortDescription?.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'all' || getCategory(og.gameId?.key) === activeCategory;
    return matchSearch && matchCat;
  });

  const availableCategories = CATEGORIES.filter(cat =>
    cat.id === 'all' || games.some(og => getCategory(og.gameId?.key) === cat.id)
  );

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* Welcome */}
      <div className="text-center mb-5">
        {customer ? (
          <div>
            <p className="text-white text-lg font-bold">Hey {customer.name}! 👋</p>
            <p className="text-white/70 text-sm mt-1">Ready to win amazing rewards?</p>
          </div>
        ) : (
          <div>
            <p className="text-white text-xl font-bold">Play & Win! 🎉</p>
            <p className="text-white/70 text-sm mt-1">Browse games and tap View to see offers & rules</p>
          </div>
        )}
      </div>

      {/* Top action */}
      <div className="mb-4">
        {token ? (
          <Link to={`/play/${orgSlug}/dashboard`}
            className="block text-center py-2.5 rounded-xl font-medium text-sm bg-white/20 text-white hover:bg-white/30 transition-colors">
            📊 My Rewards
          </Link>
        ) : (
          <Link to={`/play/${orgSlug}/login`}
            className="block text-center py-2.5 rounded-xl font-semibold text-white text-sm"
            style={{ background: 'var(--brand-btn, #6366f1)' }}>
            🔑 Login to Play
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input type="text" placeholder="Search games..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/90 backdrop-blur-sm rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/60 shadow"
        />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
        )}
      </div>

      {/* Category tabs */}
      {availableCategories.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {availableCategories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeCategory === cat.id ? 'bg-white text-purple-700 shadow' : 'bg-white/20 text-white hover:bg-white/30'
              }`}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Game Cards */}
      {loading ? (
        <div className="text-center text-white/70 py-8">⏳ Loading games...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center bg-white/10 rounded-2xl p-8">
          <p className="text-white text-4xl mb-2">🎮</p>
          <p className="text-white font-semibold">{search ? `No games matching "${search}"` : 'No games available yet'}</p>
          <p className="text-white/60 text-sm mt-1">{search ? 'Try a different search' : 'Check back soon!'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(orgGame => {
            const icon   = GAME_ICONS[orgGame.gameId?.key] || '🎮';
            const offers = orgGame.assignedOffers || [];
            const catId  = getCategory(orgGame.gameId?.key);
            const cat    = CATEGORIES.find(c => c.id === catId);
            const maxTries = orgGame.gameConfig?.maxTries ?? 1;
            return (
              <div key={orgGame._id} className="bg-white rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center text-3xl flex-shrink-0">
                    {orgGame.gameId?.imageUrl
                      ? <img src={orgGame.gameId.imageUrl} className="w-full h-full object-cover rounded-xl" alt="" />
                      : icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-sm">{orgGame.gameId?.name}</h3>
                      {cat && cat.id !== 'all' && (
                        <span className="text-[9px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                          {cat.emoji} {cat.label}
                        </span>
                      )}
                      {/* Try Again badge on game card */}
                      {maxTries > 1 && (
                        <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">
                          🔄 {maxTries} tries
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{orgGame.gameId?.shortDescription}</p>
                    {offers.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {offers.slice(0, 2).map(o => (
                          <span key={o._id} className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">
                            {o.discountType === 'percentage' ? `${o.discountValue}% off` : `₹${o.discountValue} off`}
                          </span>
                        ))}
                        {offers.length > 2 && <span className="text-[10px] text-gray-400">+{offers.length - 2} more</span>}
                      </div>
                    )}
                  </div>
                  {token ? (
                    <button onClick={() => navigate(`/play/${orgSlug}/start/${orgGame._id}`)}
                      className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold text-white"
                      style={{ background: 'var(--brand-btn, #6366f1)' }}>
                      {icon} Play
                    </button>
                  ) : (
                    <button onClick={() => setSelected(orgGame)}
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

      {/* Game Detail Dialog */}
      {selected && (
        <GameDialog
          orgGame={selected} orgSlug={orgSlug} token={token}
          onClose={() => setSelected(null)}
          onStart={() => { setSelected(null); handleStartFromDialog(selected); }}
        />
      )}
    </div>
  );
}
