import React, { useEffect, useState } from 'react';
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
  { id: 'arcade', label: 'Arcade', emoji: '🕹️', keys: ['catch_popcorn'] },
  { id: 'lucky',  label: 'Lucky',  emoji: '🍀', keys: ['spin_wheel', 'scratch_card'] },
];

function getCategory(gameKey) {
  return CATEGORIES.find(c => c.keys?.includes(gameKey))?.id || 'lucky';
}

function splitDuration(gameConfig = {}) {
  if (gameConfig.durationMins !== undefined || gameConfig.durationSecs !== undefined) {
    return { durationMins: gameConfig.durationMins ?? 0, durationSecs: gameConfig.durationSecs ?? 20 };
  }
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
          <label className="label">Popcorn to Catch to Win
            <span className="ml-1 text-xs font-normal text-gray-400">(min catch count for reward)</span>
          </label>
          <input className="input" type="number" min="1" max="100"
            value={form.gameConfig?.winThreshold ?? 10}
            onChange={e => {
              const val = parseInt(e.target.value) || 1;
              setForm(p => ({ ...p, gameConfig: { ...p.gameConfig, winThreshold: val } }));
            }}
          />
        </div>
        <div>
          <label className="label">Game Duration</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Minutes</label>
              <input className="input" type="number" min="0" max="10" value={mins}
                onChange={e => {
                  const m = parseInt(e.target.value) || 0;
                  setForm(p => ({ ...p, gameConfig: { ...p.gameConfig, durationMins: m, durationSeconds: m * 60 + (p.gameConfig?.durationSecs ?? 20) } }));
                }}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Seconds</label>
              <input className="input" type="number" min="0" max="59" value={secs}
                onChange={e => {
                  const s = Math.min(59, parseInt(e.target.value) || 0);
                  setForm(p => ({ ...p, gameConfig: { ...p.gameConfig, durationSecs: s, durationSeconds: (p.gameConfig?.durationMins ?? 0) * 60 + s } }));
                }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">Total: <strong>{mins * 60 + secs}s</strong></p>
        </div>
      </div>
    );
  }
  if (gameKey === 'spin_wheel') {
    return (
      <div className="space-y-3 pt-2 border-t border-gray-100">
        <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">🎡 Spin Wheel Settings</p>
        <div>
          <label className="label">Number of Spins Allowed</label>
          <input className="input" type="number" min="1" max="10"
            value={form.gameConfig?.spinsAllowed ?? 1}
            onChange={e => setForm(p => ({ ...p, gameConfig: { ...p.gameConfig, spinsAllowed: parseInt(e.target.value) || 1 } }))}
          />
        </div>
      </div>
    );
  }
  if (gameKey === 'scratch_card') {
    return (
      <div className="space-y-3 pt-2 border-t border-gray-100">
        <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">🃏 Scratch Card Settings</p>
        <div>
          <label className="label">Scratch % to Reveal</label>
          <input className="input" type="number" min="10" max="90"
            value={form.gameConfig?.scratchPercent ?? 60}
            onChange={e => setForm(p => ({ ...p, gameConfig: { ...p.gameConfig, scratchPercent: parseInt(e.target.value) || 60 } }))}
          />
          <p className="text-xs text-gray-400 mt-1">How much area must be scratched to reveal reward (default 60%)</p>
        </div>
      </div>
    );
  }
  return null;
}

// ── Info Modal Content ────────────────────────────────────────────────────────────
function InfoContent({ game }) {
  if (!game) return null;
  const gc = game.orgConfig?.gameConfig || {};
  const { durationMins, durationSecs } = splitDuration(gc);
  const hasConfig = game.orgConfig?.isEnabled !== undefined || Object.keys(gc).length > 0;

  return (
    <div className="space-y-4">
      {/* Description */}
      <p className="text-sm text-gray-600">{game.fullDescription || game.shortDescription}</p>

      {/* Live configured values */}
      {hasConfig && (
        <div className="bg-purple-50 rounded-xl p-4">
          <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-3">⚙️ Current Configuration</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-lg p-2 text-center">
              <p className="text-[10px] text-gray-400 uppercase">Status</p>
              <p className={`text-xs font-bold mt-0.5 ${game.orgConfig?.isEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                {game.orgConfig?.isEnabled ? '✅ Active' : '❌ Disabled'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <p className="text-[10px] text-gray-400 uppercase">Offers</p>
              <p className="text-xs font-bold mt-0.5 text-purple-600">
                {game.orgConfig?.assignedOffers?.length || 0} assigned
              </p>
            </div>
            {game.key === 'catch_popcorn' && (
              <>
                <div className="bg-white rounded-lg p-2 text-center">
                  <p className="text-[10px] text-gray-400 uppercase">Catch to Win</p>
                  <p className="text-xs font-bold mt-0.5 text-purple-600">{gc.winThreshold ?? 10} 🍿</p>
                </div>
                <div className="bg-white rounded-lg p-2 text-center">
                  <p className="text-[10px] text-gray-400 uppercase">Duration</p>
                  <p className="text-xs font-bold mt-0.5 text-blue-600">
                    {durationMins > 0 ? `${durationMins}m ` : ''}{durationSecs}s
                  </p>
                </div>
              </>
            )}
            {game.key === 'spin_wheel' && gc.spinsAllowed && (
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="text-[10px] text-gray-400 uppercase">Spins</p>
                <p className="text-xs font-bold mt-0.5 text-purple-600">{gc.spinsAllowed} allowed</p>
              </div>
            )}
            {game.key === 'scratch_card' && gc.scratchPercent && (
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="text-[10px] text-gray-400 uppercase">Scratch %</p>
                <p className="text-xs font-bold mt-0.5 text-purple-600">{gc.scratchPercent}%</p>
              </div>
            )}
            {game.orgConfig?.timerMinutes > 0 && (
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="text-[10px] text-gray-400 uppercase">Timer Limit</p>
                <p className="text-xs font-bold mt-0.5 text-orange-500">{game.orgConfig.timerMinutes} min</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assigned Offers list */}
      {game.orgConfig?.assignedOffers?.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">🎁 Assigned Offers</h4>
          <div className="space-y-1.5">
            {game.orgConfig.assignedOffers.map(o => (
              <div key={o._id || o} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-sm text-gray-700">{o.name || o}</span>
                {o.discountValue && (
                  <span className="text-xs font-semibold text-purple-600">
                    {o.discountType === 'percentage' ? `${o.discountValue}% off` : `₹${o.discountValue} off`}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video demo */}
      {game.videoDemoUrl && (
        <div>
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">🎥 Video Demo</h4>
          <a href={game.videoDemoUrl} target="_blank" rel="noreferrer" className="text-brand text-sm underline">Watch Demo</a>
        </div>
      )}

      {/* Static rules */}
      {game.rules?.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">📝 Game Rules</h4>
          <ul className="space-y-1.5">
            {game.rules.map((r, i) => (
              <li key={i} className="text-sm text-gray-600 flex gap-2">
                <span className="text-brand font-bold flex-shrink-0">{i + 1}.</span>{r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function GamesPage() {
  const [games, setGames]             = useState([]);
  const [offers, setOffers]           = useState([]);
  const [configGame, setConfigGame]   = useState(null);
  const [infoGame, setInfoGame]       = useState(null);
  const [previewGame, setPreviewGame] = useState(null);
  const [configForm, setConfigForm]   = useState({ assignedOffers: [], timerMinutes: 0, gameConfig: {} });
  const [saving, setSaving]           = useState(false);
  const [search, setSearch]           = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    api.get('/games').then(r => setGames(r.data));
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
    if (enabled && !game.orgConfig?.assignedOffers?.length) {
      openConfig({ ...game, _pendingEnable: true });
      return;
    }
    try {
      await api.post(`/games/${game._id}/configure`, { isEnabled: enabled });
      setGames(prev => prev.map(g =>
        g._id === game._id ? { ...g, orgConfig: { ...g.orgConfig, isEnabled: enabled } } : g
      ));
      toast.success(enabled ? 'Game enabled' : 'Game disabled');
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const isEnabled = configGame._pendingEnable ? true : configGame.orgConfig?.isEnabled;
      const payload = { ...configForm, isEnabled };
      if (configGame.key === 'catch_popcorn' && payload.gameConfig) {
        const mins = payload.gameConfig.durationMins ?? 0;
        const secs = payload.gameConfig.durationSecs ?? 20;
        payload.gameConfig = { ...payload.gameConfig, durationSeconds: mins * 60 + secs };
      }
      await api.post(`/games/${configGame._id}/configure`, payload);
      const r = await api.get('/games');
      setGames(r.data);
      setConfigGame(null);
      toast.success('Game configured!');
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  // Filter games
  const filtered = games.filter(game => {
    const matchSearch = !search ||
      game.name?.toLowerCase().includes(search.toLowerCase()) ||
      game.shortDescription?.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'all' || getCategory(game.key) === activeCategory;
    return matchSearch && matchCat;
  });

  const availableCategories = CATEGORIES.filter(cat =>
    cat.id === 'all' || games.some(g => getCategory(g.key) === cat.id)
  );

  return (
    <div className="p-6">
      <PageHeader title="Games" subtitle="Enable and configure games for your customers" />

      {/* Search + Category filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Search games..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9 pr-8"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
              ✕
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2">
          {availableCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                activeCategory === cat.id
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand hover:text-brand'
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Game Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">🎮</p>
          <p className="font-medium">{search ? `No games matching "${search}"` : 'No games in this category'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(game => {
            const meta = GAME_META[game.key] || { icon: '❓', preview: null };
            const enabled = game.orgConfig?.isEnabled;
            const offersCount = game.orgConfig?.assignedOffers?.length || 0;
            const gc = game.orgConfig?.gameConfig || {};
            const { durationMins, durationSecs } = splitDuration(gc);
            const cat = CATEGORIES.find(c => c.id === getCategory(game.key));

            return (
              <div key={game._id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-2xl">{meta.icon}</div>
                    {/* Category badge */}
                    {cat && cat.id !== 'all' && (
                      <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                        {cat.emoji} {cat.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {meta.preview && (
                      <button onClick={() => setPreviewGame(game)}
                        className="text-xs text-purple-500 hover:text-purple-700 px-2 py-1 rounded border border-purple-200 hover:bg-purple-50">
                        ▶ Preview
                      </button>
                    )}
                    <button onClick={() => setInfoGame(game)}
                      className="text-xs text-gray-400 hover:text-brand px-2 py-1 rounded border border-gray-200">
                      Info
                    </button>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={!!enabled}
                        onChange={e => handleToggle(game, e.target.checked)} />
                      <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-brand peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                    </label>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900">{game.name}</h3>
                <p className="text-xs text-gray-500 mt-1 mb-3">{game.shortDescription}</p>

                {/* Config summary chips */}
                {game.key === 'catch_popcorn' && game.orgConfig?.gameConfig && (
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">
                      🍿 Win: {gc.winThreshold ?? 10} catches
                    </span>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                      ⏱ {durationMins > 0 ? `${durationMins}m ` : ''}{durationSecs}s
                    </span>
                  </div>
                )}
                {game.key === 'spin_wheel' && gc.spinsAllowed && (
                  <div className="flex gap-2 mb-3">
                    <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">
                      🔄 {gc.spinsAllowed} spin{gc.spinsAllowed > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {game.key === 'scratch_card' && gc.scratchPercent && (
                  <div className="flex gap-2 mb-3">
                    <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">
                      ✏️ Scratch {gc.scratchPercent}%
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    enabled ? 'badge-active' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {enabled ? 'Active' : 'Disabled'}
                  </span>
                  <span className="text-xs text-gray-400">{offersCount} offer{offersCount !== 1 ? 's' : ''}</span>
                </div>
                <button onClick={() => openConfig(game)} className="mt-3 btn-secondary w-full text-xs py-1.5">
                  Configure
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Config Modal */}
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
                  <span className="text-xs text-gray-400 ml-auto">
                    {o.discountType === 'percentage' ? `${o.discountValue}%` : `₹${o.discountValue}`}
                  </span>
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

      {/* Info Modal — now shows live config */}
      <Modal open={!!infoGame} onClose={() => setInfoGame(null)} title={infoGame?.name} size="md">
        <InfoContent game={infoGame} />
      </Modal>

      {/* Preview Modal */}
      <Modal open={!!previewGame} onClose={() => setPreviewGame(null)} title={`Preview — ${previewGame?.name}`} size="xl">
        <div className="rounded-xl overflow-hidden" style={{ height: 520 }}>
          {previewGame && GAME_META[previewGame.key]?.preview && (
            <iframe
              src={GAME_META[previewGame.key].preview}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Game Preview"
              allow="autoplay"
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
