import React, { useEffect, useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';

const GAME_META = {
  spin_wheel:    { icon: '🎡', preview: null },
  scratch_card:  { icon: '🃏', preview: null },
  catch_popcorn: { icon: '🍿', preview: '/games/catch-popcorn/index.html' },
};

const CATEGORIES = [
  { id: 'all',    label: 'All',    emoji: '🎮' },
  { id: 'arcade', label: 'Arcade', emoji: '🕹️' },
  { id: 'lucky',  label: 'Lucky',  emoji: '🍀' },
  { id: 'puzzle', label: 'Puzzle', emoji: '🧩' },
  { id: 'trivia', label: 'Trivia', emoji: '🧠' },
];

const ORG_TYPES = [
  { id: '',           label: 'All Types' },
  { id: 'saloon',     label: '✂️ Saloon' },
  { id: 'cafe',       label: '☕ Cafe' },
  { id: 'restaurant', label: '🍽️ Restaurant' },
  { id: 'others',     label: '🏢 Others' },
];

function splitDuration(gameConfig = {}) {
  if (gameConfig.durationMins !== undefined || gameConfig.durationSecs !== undefined)
    return { durationMins: gameConfig.durationMins ?? 0, durationSecs: gameConfig.durationSecs ?? 20 };
  const total = gameConfig.durationSeconds ?? 20;
  return { durationMins: Math.floor(total / 60), durationSecs: total % 60 };
}

function GameExtraConfig({ gameKey, form, setForm }) {
  if (gameKey === 'catch_popcorn') {
    const mins = form.gameConfig?.durationMins ?? 0;
    const secs = form.gameConfig?.durationSecs ?? 20;
    return (
      <div className="space-y-4 pt-2 border-t border-gray-100">
        <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">🍿 Catch Popcorn Settings</p>
        <div>
          <label className="label">Popcorn to Catch to Win</label>
          <input className="input" type="number" min="1" max="100"
            value={form.gameConfig?.winThreshold ?? 10}
            onChange={e => setForm(p => ({ ...p, gameConfig: { ...p.gameConfig, winThreshold: parseInt(e.target.value) || 1 } }))}
          />
        </div>
        <div>
          <label className="label">Game Duration</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Minutes</label>
              <input className="input" type="number" min="0" max="10" value={mins}
                onChange={e => { const m = parseInt(e.target.value)||0; setForm(p => ({ ...p, gameConfig: { ...p.gameConfig, durationMins: m, durationSeconds: m*60+(p.gameConfig?.durationSecs??20) } })); }}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Seconds</label>
              <input className="input" type="number" min="0" max="59" value={secs}
                onChange={e => { const s = Math.min(59,parseInt(e.target.value)||0); setForm(p => ({ ...p, gameConfig: { ...p.gameConfig, durationSecs: s, durationSeconds: (p.gameConfig?.durationMins??0)*60+s } })); }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">Total: <strong>{mins*60+secs}s</strong></p>
        </div>
      </div>
    );
  }
  if (gameKey === 'spin_wheel') return (
    <div className="space-y-3 pt-2 border-t border-gray-100">
      <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">🎡 Spin Wheel Settings</p>
      <div>
        <label className="label">Spins Allowed</label>
        <input className="input" type="number" min="1" max="10"
          value={form.gameConfig?.spinsAllowed ?? 1}
          onChange={e => setForm(p => ({ ...p, gameConfig: { ...p.gameConfig, spinsAllowed: parseInt(e.target.value)||1 } }))}
        />
      </div>
    </div>
  );
  if (gameKey === 'scratch_card') return (
    <div className="space-y-3 pt-2 border-t border-gray-100">
      <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">🃏 Scratch Card Settings</p>
      <div>
        <label className="label">Scratch % to Reveal</label>
        <input className="input" type="number" min="10" max="90"
          value={form.gameConfig?.scratchPercent ?? 60}
          onChange={e => setForm(p => ({ ...p, gameConfig: { ...p.gameConfig, scratchPercent: parseInt(e.target.value)||60 } }))}
        />
      </div>
    </div>
  );
  return null;
}

function GameCard({ game, onConfigure, onInfo, onPreview, onToggle, showConfigure = true }) {
  const meta    = GAME_META[game.key] || { icon: '❓', preview: null };
  const enabled = game.orgConfig?.isEnabled;
  const offersCount = game.orgConfig?.assignedOffers?.length || 0;
  const gc      = game.orgConfig?.gameConfig || {};
  const { durationMins, durationSecs } = splitDuration(gc);
  const cat     = CATEGORIES.find(c => c.id === (game.category || 'lucky'));

  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-2xl">{meta.icon}</div>
          <div>
            {cat && cat.id !== 'all' && (
              <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                {cat.emoji} {cat.label}
              </span>
            )}
            {game.isNewLaunch && (
              <span className="ml-1 text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">🚀 New</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {meta.preview && (
            <button onClick={() => onPreview(game)} className="text-xs text-purple-500 hover:text-purple-700 px-2 py-1 rounded border border-purple-200 hover:bg-purple-50">▶ Preview</button>
          )}
          <button onClick={() => onInfo(game)} className="text-xs text-gray-400 hover:text-brand px-2 py-1 rounded border border-gray-200">Info</button>
          {showConfigure && (
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={!!enabled} onChange={e => onToggle(game, e.target.checked)} />
              <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-brand peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
            </label>
          )}
        </div>
      </div>

      <h3 className="font-semibold text-gray-900">{game.name}</h3>
      <p className="text-xs text-gray-500 mt-1 mb-3 flex-1">{game.shortDescription}</p>

      {game.key === 'catch_popcorn' && gc.winThreshold && (
        <div className="flex gap-2 mb-3 flex-wrap">
          <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">🍿 Win: {gc.winThreshold} catches</span>
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">⏱ {durationMins > 0 ? `${durationMins}m ` : ''}{durationSecs}s</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ enabled ? 'badge-active' : 'bg-gray-100 text-gray-500' }`}>
          {enabled ? 'Active' : 'Disabled'}
        </span>
        <span className="text-xs text-gray-400">{offersCount} offer{offersCount !== 1 ? 's' : ''}</span>
      </div>

      {showConfigure && (
        <button onClick={() => onConfigure(game)} className="mt-3 btn-secondary w-full text-xs py-1.5">Configure</button>
      )}
      {!showConfigure && (
        <button onClick={() => onConfigure(game)} className="mt-3 btn-primary w-full text-xs py-1.5">
          {game.orgConfig ? 'Configure' : '+ Add to My Games'}
        </button>
      )}
    </div>
  );
}

// ── Marketplace Tab ───────────────────────────────────────────────────────────
function MarketplaceTab({ onConfigure, onInfo, onPreview, onToggle }) {
  const [games, setGames]         = useState([]);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('');
  const [orgType, setOrgType]     = useState('');
  const [newLaunch, setNewLaunch] = useState(false);
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(true);
  const [loading, setLoading]     = useState(false);
  const loaderRef = useRef(null);
  const LIMIT = 9;

  const fetchGames = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const p = reset ? 1 : page;
      const r = await api.get('/games/marketplace', {
        params: { search, category, orgType, newLaunch, page: p, limit: LIMIT },
      });
      setGames(prev => reset ? r.data.games : [...prev, ...r.data.games]);
      setHasMore(p < r.data.totalPages);
      setPage(p + 1);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search, category, orgType, newLaunch, page, loading]);

  useEffect(() => {
    setGames([]);
    setPage(1);
    setHasMore(true);
  }, [search, category, orgType, newLaunch]);

  useEffect(() => {
    if (games.length === 0 && hasMore) fetchGames(true);
  }, [games, hasMore]);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) fetchGames();
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, fetchGames]);

  return (
    <div>
      {/* Filters — strict single line */}
      <div className="card p-3 mb-5">
        <div className="flex items-center gap-2">
          {/* Search — takes remaining space */}
          <div className="relative flex-1 min-w-0">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              className="input pl-8 py-2 text-sm w-full"
              placeholder="Search games..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">✕</button>
            )}
          </div>

          {/* Category select */}
          <select
            className="input py-2 text-sm shrink-0 w-36"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {CATEGORIES.map(c => <option key={c.id} value={c.id === 'all' ? '' : c.id}>{c.emoji} {c.label}</option>)}
          </select>

          {/* Org type select */}
          <select
            className="input py-2 text-sm shrink-0 w-38"
            value={orgType}
            onChange={e => setOrgType(e.target.value)}
          >
            {ORG_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>

          {/* New Launch toggle */}
          <button
            onClick={() => setNewLaunch(p => !p)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-all whitespace-nowrap ${
              newLaunch
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-green-500 hover:text-green-600'
            }`}
          >
            🚀 New Launch
          </button>
        </div>
      </div>

      {/* Game grid */}
      {games.length === 0 && !loading ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">🎮</p>
          <p className="font-medium">No games found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map(game => (
            <GameCard
              key={game._id}
              game={game}
              onConfigure={onConfigure}
              onInfo={onInfo}
              onPreview={onPreview}
              onToggle={onToggle}
              showConfigure={false}
            />
          ))}
        </div>
      )}

      {/* Infinite scroll loader */}
      <div ref={loaderRef} className="py-6 text-center">
        {loading && <span className="text-sm text-gray-400">⏳ Loading more...</span>}
        {!hasMore && games.length > 0 && <span className="text-xs text-gray-300">— All games loaded —</span>}
      </div>
    </div>
  );
}

// ── Your Games Tab ────────────────────────────────────────────────────────────
function YourGamesTab({ onConfigure, onInfo, onPreview, onToggle, games }) {
  const active   = games.filter(g => g.orgConfig?.isEnabled);
  const inactive = games.filter(g => g.orgConfig && !g.orgConfig?.isEnabled);

  if (games.filter(g => g.orgConfig).length === 0) return (
    <div className="text-center py-16 text-gray-400">
      <p className="text-4xl mb-2">🎮</p>
      <p className="font-medium">No games added yet</p>
      <p className="text-sm mt-1">Go to <strong>Marketplace</strong> to add games</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">✅ Active ({active.length})</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.map(game => (
              <GameCard key={game._id} game={game} onConfigure={onConfigure} onInfo={onInfo} onPreview={onPreview} onToggle={onToggle} />
            ))}
          </div>
        </div>
      )}
      {inactive.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">⏸️ Disabled ({inactive.length})</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactive.map(game => (
              <GameCard key={game._id} game={game} onConfigure={onConfigure} onInfo={onInfo} onPreview={onPreview} onToggle={onToggle} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function GamesPage() {
  const [tab, setTab]                 = useState('yours');
  const [games, setGames]             = useState([]);
  const [offers, setOffers]           = useState([]);
  const [configGame, setConfigGame]   = useState(null);
  const [infoGame, setInfoGame]       = useState(null);
  const [previewGame, setPreviewGame] = useState(null);
  const [configForm, setConfigForm]   = useState({ assignedOffers: [], timerMinutes: 0, gameConfig: {} });
  const [saving, setSaving]           = useState(false);

  const loadMyGames = () => api.get('/games').then(r => setGames(r.data));

  useEffect(() => {
    loadMyGames();
    api.get('/offers').then(r => setOffers(r.data));
  }, []);

  const openConfig = (game) => {
    setConfigGame(game);
    const savedGameConfig = game.orgConfig?.gameConfig || {};
    let gameConfig = { ...savedGameConfig };
    if (game.key === 'catch_popcorn') {
      const { durationMins, durationSecs } = splitDuration(savedGameConfig);
      gameConfig = { ...gameConfig, durationMins, durationSecs };
    }
    setConfigForm({
      assignedOffers: game.orgConfig?.assignedOffers?.map(o => o._id || o) || [],
      timerMinutes:   game.orgConfig?.timerMinutes || 0,
      gameConfig,
    });
  };

  const handleToggle = async (game, enabled) => {
    if (enabled && !game.orgConfig?.assignedOffers?.length) { openConfig({ ...game, _pendingEnable: true }); return; }
    try {
      await api.post(`/games/${game._id}/configure`, { isEnabled: enabled });
      loadMyGames();
      toast.success(enabled ? 'Game enabled' : 'Game disabled');
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const isEnabled = configGame._pendingEnable ? true : (configGame.orgConfig?.isEnabled ?? false);
      const payload   = { ...configForm, isEnabled };
      if (configGame.key === 'catch_popcorn' && payload.gameConfig) {
        const mins = payload.gameConfig.durationMins ?? 0;
        const secs = payload.gameConfig.durationSecs ?? 20;
        payload.gameConfig = { ...payload.gameConfig, durationSeconds: mins * 60 + secs };
      }
      await api.post(`/games/${configGame._id}/configure`, payload);
      loadMyGames();
      setConfigGame(null);
      toast.success('Game configured!');
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-6">
      <PageHeader title="Games" subtitle="Manage and discover games for your customers" />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {[
          { id: 'yours',       label: '🎮 Your Games',  badge: games.filter(g => g.orgConfig?.isEnabled).length },
          { id: 'marketplace', label: '🏪 Marketplace', badge: null },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.badge !== null && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                tab === t.id ? 'bg-brand text-white' : 'bg-gray-300 text-gray-600'
              }`}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'yours' && (
        <YourGamesTab games={games} onConfigure={openConfig} onInfo={setInfoGame} onPreview={setPreviewGame} onToggle={handleToggle} />
      )}
      {tab === 'marketplace' && (
        <MarketplaceTab onConfigure={openConfig} onInfo={setInfoGame} onPreview={setPreviewGame} onToggle={handleToggle} />
      )}

      {/* Configure Modal */}
      <Modal open={!!configGame} onClose={() => setConfigGame(null)} title={`Configure — ${configGame?.name}`} size="md">
        <div className="space-y-4">
          <div>
            <label className="label">Assign Offers <span className="text-gray-400">(select multiple)</span></label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2">
              {offers.length === 0 && <p className="text-sm text-gray-400">No offers yet. Create offers first.</p>}
              {offers.map(o => (
                <label key={o._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                  <input type="checkbox" className="rounded"
                    checked={configForm.assignedOffers.includes(o._id)}
                    onChange={e => setConfigForm(prev => ({
                      ...prev,
                      assignedOffers: e.target.checked
                        ? [...prev.assignedOffers, o._id]
                        : prev.assignedOffers.filter(id => id !== o._id)
                    }))}
                  />
                  <span className="text-sm">{o.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{o.discountType === 'percentage' ? `${o.discountValue}%` : `₹${o.discountValue}`}</span>
                </label>
              ))}
            </div>
          </div>
          <GameExtraConfig gameKey={configGame?.key} form={configForm} setForm={setConfigForm} />
          <button className="btn-primary w-full" onClick={handleSaveConfig} disabled={saving}>
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </Modal>

      {/* Info Modal */}
      <Modal open={!!infoGame} onClose={() => setInfoGame(null)} title={infoGame?.name} size="md">
        <div className="space-y-3">
          <p className="text-sm text-gray-600">{infoGame?.fullDescription || infoGame?.shortDescription}</p>
          {infoGame?.rules?.length > 0 && (
            <ul className="space-y-1.5">
              {infoGame.rules.map((r, i) => (
                <li key={i} className="text-sm text-gray-600 flex gap-2">
                  <span className="text-brand font-bold flex-shrink-0">{i + 1}.</span>{r}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal open={!!previewGame} onClose={() => setPreviewGame(null)} title={`Preview — ${previewGame?.name}`} size="xl">
        <div className="rounded-xl overflow-hidden" style={{ height: 520 }}>
          {previewGame && GAME_META[previewGame.key]?.preview && (
            <iframe src={GAME_META[previewGame.key].preview} style={{ width: '100%', height: '100%', border: 'none' }} title="Game Preview" allow="autoplay" />
          )}
        </div>
      </Modal>
    </div>
  );
}
