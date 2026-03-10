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

// Per-game extra config fields
function GameExtraConfig({ gameKey, form, setForm }) {
  if (gameKey === 'catch_popcorn') {
    return (
      <div className="space-y-4 pt-2 border-t border-gray-100">
        <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">🍿 Catch Popcorn Settings</p>
        <div>
          <label className="label">
            Popcorn to Catch to Win
            <span className="ml-1 text-xs font-normal text-gray-400">(min catch count for reward)</span>
          </label>
          <input
            className="input"
            type="number" min="1" max="100"
            value={form.gameConfig?.winThreshold ?? 10}
            onChange={e => setForm(p => ({ ...p, gameConfig: { ...p.gameConfig, winThreshold: parseInt(e.target.value) || 10 } }))}
          />
        </div>
        <div>
          <label className="label">Game Duration</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Minutes</label>
              <input
                className="input"
                type="number" min="0" max="10"
                value={form.gameConfig?.durationMins ?? 0}
                onChange={e => setForm(p => ({ ...p, gameConfig: { ...p.gameConfig, durationMins: parseInt(e.target.value) || 0 } }))}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Seconds</label>
              <input
                className="input"
                type="number" min="0" max="59"
                value={form.gameConfig?.durationSecs ?? 20}
                onChange={e => setForm(p => ({ ...p, gameConfig: { ...p.gameConfig, durationSecs: parseInt(e.target.value) || 20 } }))}
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Total: <strong>{((form.gameConfig?.durationMins ?? 0) * 60) + (form.gameConfig?.durationSecs ?? 20)}s</strong>
          </p>
        </div>
      </div>
    );
  }
  // Spin wheel extra config
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
  // Scratch card extra config
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
          <p className="text-xs text-gray-400 mt-1">How much area the customer must scratch to reveal the reward (default 60%)</p>
        </div>
      </div>
    );
  }
  return null;
}

export default function GamesPage() {
  const [games, setGames] = useState([]);
  const [offers, setOffers] = useState([]);
  const [configGame, setConfigGame] = useState(null);
  const [infoGame, setInfoGame] = useState(null);
  const [previewGame, setPreviewGame] = useState(null);
  const [configForm, setConfigForm] = useState({ assignedOffers: [], timerMinutes: 0, gameConfig: {} });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/games').then(r => setGames(r.data));
    api.get('/offers').then(r => setOffers(r.data));
  }, []);

  const openConfig = (game) => {
    setConfigGame(game);
    setConfigForm({
      assignedOffers: game.orgConfig?.assignedOffers?.map(o => o._id || o) || [],
      timerMinutes: game.orgConfig?.timerMinutes || 0,
      gameConfig: game.orgConfig?.gameConfig || {}
    });
  };

  const handleToggle = async (game, enabled) => {
    if (enabled && !game.orgConfig?.assignedOffers?.length) {
      openConfig({ ...game, _pendingEnable: true });
      return;
    }
    try {
      await api.post(`/games/${game._id}/configure`, { isEnabled: enabled });
      setGames(prev => prev.map(g => g._id === game._id
        ? { ...g, orgConfig: { ...g.orgConfig, isEnabled: enabled } } : g));
      toast.success(enabled ? 'Game enabled' : 'Game disabled');
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const isEnabled = configGame._pendingEnable ? true : configGame.orgConfig?.isEnabled;
      // Calculate total duration in seconds for catch_popcorn
      let payload = { ...configForm, isEnabled };
      if (configGame.key === 'catch_popcorn' && payload.gameConfig) {
        const totalSecs = ((payload.gameConfig.durationMins || 0) * 60) + (payload.gameConfig.durationSecs || 20);
        payload.gameConfig = { ...payload.gameConfig, durationSeconds: totalSecs };
      }
      await api.post(`/games/${configGame._id}/configure`, payload);
      const r = await api.get('/games');
      setGames(r.data);
      setConfigGame(null);
      toast.success('Game configured!');
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-6">
      <PageHeader title="Games" subtitle="Enable and configure games for your customers" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map(game => {
          const meta = GAME_META[game.key] || { icon: '❓', preview: null };
          const enabled = game.orgConfig?.isEnabled;
          const offersCount = game.orgConfig?.assignedOffers?.length || 0;
          return (
            <div key={game._id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-2xl">{meta.icon}</div>
                <div className="flex items-center gap-2">
                  {meta.preview && (
                    <button onClick={() => setPreviewGame(game)}
                      className="text-xs text-purple-500 hover:text-purple-700 px-2 py-1 rounded border border-purple-200 hover:bg-purple-50">
                      ▶ Preview
                    </button>
                  )}
                  <button onClick={() => setInfoGame(game)} className="text-xs text-gray-400 hover:text-brand px-2 py-1 rounded border border-gray-200">Info</button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={!!enabled}
                      onChange={e => handleToggle(game, e.target.checked)} />
                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-brand peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                  </label>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900">{game.name}</h3>
              <p className="text-xs text-gray-500 mt-1 mb-3">{game.shortDescription}</p>
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${enabled ? 'badge-active' : 'bg-gray-100 text-gray-500'}`}>
                  {enabled ? 'Active' : 'Disabled'}
                </span>
                <span className="text-xs text-gray-400">{offersCount} offer{offersCount !== 1 ? 's' : ''}</span>
              </div>
              <button onClick={() => openConfig(game)} className="mt-3 btn-secondary w-full text-xs py-1.5">Configure</button>
            </div>
          );
        })}
      </div>

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
                  <span className="text-xs text-gray-400 ml-auto">{o.discountType === 'percentage' ? `${o.discountValue}%` : `₹${o.discountValue}`}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Game-specific extra config */}
          <GameExtraConfig
            gameKey={configGame?.key}
            form={configForm}
            setForm={setConfigForm}
          />

          <button className="btn-primary w-full" onClick={handleSaveConfig} disabled={saving}>
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </Modal>

      {/* Info Modal */}
      <Modal open={!!infoGame} onClose={() => setInfoGame(null)} title={infoGame?.name} size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{infoGame?.fullDescription}</p>
          {infoGame?.videoDemoUrl && (
            <div><h4 className="label">Video Demo</h4>
              <a href={infoGame.videoDemoUrl} target="_blank" rel="noreferrer" className="text-brand text-sm underline">Watch Demo</a>
            </div>
          )}
          {infoGame?.rules?.length > 0 && (
            <div><h4 className="label">Game Rules</h4>
              <ul className="space-y-1">
                {infoGame.rules.map((r, i) => (
                  <li key={i} className="text-sm text-gray-600 flex gap-2">
                    <span className="text-brand font-bold">{i+1}.</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
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
