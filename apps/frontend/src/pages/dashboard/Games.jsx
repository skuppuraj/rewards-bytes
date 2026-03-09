import { useEffect, useState } from 'react';
import { Gamepad2, Plus, Trash2, ToggleLeft, ToggleRight, Loader2, Link2 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Modal from '@/components/ui/modal';
import EmptyState from '@/components/shared/EmptyState';
import api from '@/lib/api';

const GAME_TYPES = [
  { value: 'spin_wheel', label: '🎡 Spin Wheel' },
  { value: 'scratch_card', label: '🎴 Scratch Card' },
  { value: 'quiz', label: '🧠 Quiz' },
  { value: 'points_tap', label: '👆 Points Tap' },
];

const gameTypeColor = { spin_wheel: 'indigo', scratch_card: 'orange', quiz: 'purple', points_tap: 'green' };

export default function Games() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'spin_wheel', pointsPerPlay: 10 });

  const fetchGames = async () => {
    try { const { data } = await api.get('/games'); setGames(data); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchGames(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.post('/games', form); setForm({ name: '', type: 'spin_wheel', pointsPerPlay: 10 }); setAddOpen(false); fetchGames(); }
    finally { setSaving(false); }
  };

  const handleToggle = async (game) => { await api.patch(`/games/${game._id}`, { isActive: !game.isActive }); fetchGames(); };
  const handleDelete = async (id) => { if (!confirm('Delete this game?')) return; await api.delete(`/games/${id}`); fetchGames(); };

  return (
    <div className="p-6 lg:p-8">
      <PageHeader title="Games" subtitle="Configure game-based reward experiences"
        action={<Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-2" /> Create Game</Button>}
      />
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
      ) : games.length === 0 ? (
        <EmptyState icon={Gamepad2} title="No games yet" description="Create your first game to start engaging players"
          action={<Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-2" />Create Game</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {games.map(game => (
            <div key={game._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{game.name}</h3>
                  <Badge variant={gameTypeColor[game.type]} className="mt-1">{GAME_TYPES.find(t => t.value === game.type)?.label}</Badge>
                </div>
                <button onClick={() => handleToggle(game)}>
                  {game.isActive ? <ToggleRight className="w-6 h-6 text-indigo-600" /> : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                </button>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                <div className="flex-1 rounded-lg bg-gray-50 px-3 py-2 text-center">
                  <p className="text-xs text-gray-400">Points/Play</p>
                  <p className="text-lg font-bold text-indigo-700">{game.pointsPerPlay}</p>
                </div>
                <div className="flex-1 rounded-lg bg-gray-50 px-3 py-2 text-center">
                  <p className="text-xs text-gray-400">Status</p>
                  <p className={`text-sm font-semibold ${game.isActive ? 'text-green-600' : 'text-gray-400'}`}>{game.isActive ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
              {game.type === 'spin_wheel' && (
                <Button size="sm" variant="outline" className="w-full mt-2"
                  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/play/${game._id}`); alert('Game link copied!'); }}>
                  <Link2 className="w-3.5 h-3.5 mr-1.5" /> Copy Play Link
                </Button>
              )}
              <Button variant="ghost" size="sm" className="w-full mt-2 text-red-500 hover:bg-red-50" onClick={() => handleDelete(game._id)}>
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
              </Button>
            </div>
          ))}
        </div>
      )}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Create New Game">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-1"><label className="text-sm font-medium text-gray-700">Game Name *</label>
            <Input placeholder="e.g. Lucky Spin" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
          <div className="space-y-1"><label className="text-sm font-medium text-gray-700">Game Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {GAME_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => setForm(f => ({ ...f, type: t.value }))}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left ${
                    form.type === t.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>{t.label}</button>
              ))}
            </div>
          </div>
          <div className="space-y-1"><label className="text-sm font-medium text-gray-700">Points Per Play</label>
            <Input type="number" min="1" value={form.pointsPerPlay} onChange={e => setForm(f => ({ ...f, pointsPerPlay: Number(e.target.value) }))} /></div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Game'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
