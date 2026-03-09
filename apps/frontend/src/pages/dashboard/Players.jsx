import { useEffect, useState } from 'react';
import { Users, Plus, Trash2, Trophy, Loader2, Award } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Modal from '@/components/ui/modal';
import EmptyState from '@/components/shared/EmptyState';
import api from '@/lib/api';

const levelColor = (level) => level >= 5 ? 'purple' : level >= 3 ? 'indigo' : 'default';

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [awardOpen, setAwardOpen] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [awardPoints, setAwardPoints] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchPlayers = async () => {
    try { const { data } = await api.get('/players'); setPlayers(data); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPlayers(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.post('/players', form); setForm({ name: '', email: '', phone: '' }); setAddOpen(false); fetchPlayers(); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this player?')) return;
    await api.delete(`/players/${id}`); fetchPlayers();
  };

  const handleAward = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.post(`/players/${awardOpen._id}/award-points`, { points: Number(awardPoints) }); setAwardOpen(null); setAwardPoints(''); fetchPlayers(); }
    finally { setSaving(false); }
  };

  const filtered = players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 lg:p-8">
      <PageHeader title="Players" subtitle="Manage your loyalty program members"
        action={<Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Player</Button>}
      />
      <div className="mb-5">
        <Input placeholder="Search players..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="No players yet" description="Add your first player to start the rewards program"
            action={<Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Player</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Player</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Contact</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Level</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Points</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((player, idx) => (
                  <tr key={player._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs shrink-0">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{player.name}</p>
                          {idx < 3 && <p className="text-xs text-yellow-600">{idx === 0 ? '🥇 Top' : idx === 1 ? '🥈 2nd' : '🥉 3rd'}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500"><p>{player.email || '—'}</p><p className="text-xs">{player.phone || ''}</p></td>
                    <td className="px-5 py-3.5"><Badge variant={levelColor(player.level)}>Level {player.level}</Badge></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="font-semibold text-gray-900">{player.totalPoints.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setAwardOpen(player)}><Award className="w-3.5 h-3.5 mr-1" /> Award</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(player._id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Player">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-1"><label className="text-sm font-medium text-gray-700">Full Name *</label>
            <Input placeholder="John Doe" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
          <div className="space-y-1"><label className="text-sm font-medium text-gray-700">Email</label>
            <Input type="email" placeholder="john@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          <div className="space-y-1"><label className="text-sm font-medium text-gray-700">Phone</label>
            <Input placeholder="+91 9876543210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Player'}</Button>
          </div>
        </form>
      </Modal>
      <Modal open={!!awardOpen} onClose={() => setAwardOpen(null)} title={`Award Points — ${awardOpen?.name}`} size="sm">
        <form onSubmit={handleAward} className="space-y-4">
          <div className="rounded-xl bg-indigo-50 p-4 text-center">
            <p className="text-sm text-gray-500">Current Points</p>
            <p className="text-3xl font-bold text-indigo-700 mt-1">{awardOpen?.totalPoints?.toLocaleString()}</p>
          </div>
          <div className="space-y-1"><label className="text-sm font-medium text-gray-700">Points to Award</label>
            <Input type="number" min="1" placeholder="e.g. 50" value={awardPoints} onChange={e => setAwardPoints(e.target.value)} required /></div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setAwardOpen(null)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Award Points'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
