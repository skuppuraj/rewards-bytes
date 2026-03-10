import React, { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const GAME_ICONS = { spin_wheel: '🎡', scratch_card: '🃏', catch_popcorn: '🍿' };

export default function GameHistoryPage() {
  const [data, setData]       = useState({ history: [], total: 0, totalPages: 1 });
  const [page, setPage]       = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [search, setSearch]   = useState('');
  const [from, setFrom]       = useState('');
  const [to, setTo]           = useState('');
  const [expanded, setExpanded]   = useState({});
  const [loading, setLoading]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  const load = useCallback(async (overrides = {}) => {
    setLoading(true);
    try {
      const params = { page, limit: perPage, search, from, to, ...overrides };
      const r = await api.get('/game-history', { params });
      setData(r.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, perPage, search, from, to]);

  useEffect(() => { load(); }, [page, perPage]);

  const handleSearch = () => { setPage(1); load({ page: 1 }); };
  const handleClear  = () => {
    setSearch(''); setFrom(''); setTo(''); setPage(1);
    load({ search: '', from: '', to: '', page: 1 });
  };

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const confirmDelete = (session) => {
    setDeleteTarget({ sessionId: session._id, gameName: session.gameId?.name || 'this session' });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/game-history/session/${deleteTarget.sessionId}`);
      toast.success('Session deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error deleting');
    } finally { setDeleting(false); }
  };

  return (
    <div className="p-6">
      <PageHeader title="Game History" subtitle="All customer play sessions" />

      {/* Filters — single line */}
      <div className="card p-3 mb-4">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
            <input
              className="input pl-7 py-2 text-sm w-full"
              placeholder="Search by name or phone"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>

          {/* From date */}
          <div className="flex items-center gap-1 shrink-0">
            <label className="text-xs text-gray-400 whitespace-nowrap">From</label>
            <input className="input py-2 text-sm w-32" type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>

          {/* To date */}
          <div className="flex items-center gap-1 shrink-0">
            <label className="text-xs text-gray-400 whitespace-nowrap">To</label>
            <input className="input py-2 text-sm w-32" type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>

          {/* Actions */}
          <button className="btn-primary py-2 px-4 text-sm shrink-0" onClick={handleSearch}>Search</button>
          <button className="btn-secondary py-2 px-3 text-sm shrink-0" onClick={handleClear}>✕ Clear</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading && <div className="text-center py-3 text-sm text-gray-400">Loading...</div>}
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['#', 'Customer', 'Phone', 'Games Played', 'Offers Obtained', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.history.map((row, i) => (
              <React.Fragment key={row.customer?._id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{(page - 1) * perPage + i + 1}</td>
                  <td className="px-4 py-3 font-medium">{row.customer?.name}</td>
                  <td className="px-4 py-3 text-gray-500">{row.customer?.phone}</td>
                  <td className="px-4 py-3">{row.gamesPlayed}</td>
                  <td className="px-4 py-3">{row.offersObtained}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(row.customer?._id)} className="text-xs text-brand hover:underline">
                      {expanded[row.customer?._id] ? '▲ Hide' : '▼ View'}
                    </button>
                  </td>
                </tr>

                {expanded[row.customer?._id] && (
                  <tr>
                    <td colSpan={6} className="px-4 py-2 bg-primary-50">
                      <div className="space-y-2">
                        {row.sessions.map(s => (
                          <div key={s._id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
                            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center text-lg flex-shrink-0">
                              {GAME_ICONS[s.gameId?.key] || '🎮'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{s.gameId?.name || 'Unknown Game'}</p>
                              <p className="text-xs text-gray-400">
                                {s.startedAt ? format(new Date(s.startedAt), 'dd MMM yyyy, HH:mm') : '—'}
                              </p>
                            </div>
                            {s.result?.score !== undefined && (
                              <div className="text-center flex-shrink-0">
                                <p className="text-lg font-black text-brand">{s.result.score}</p>
                                <p className="text-[10px] text-gray-400">score</p>
                              </div>
                            )}
                            <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                              s.result?.won ? 'bg-green-100 text-green-700'
                              : s.offerId   ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-500'
                            }`}>
                              {s.result?.won ? '🎉 Won' : s.offerId ? '🎁 Offer' : 'No reward'}
                            </span>
                            {s.offerId && (
                              <div className="flex-shrink-0 text-right">
                                <p className="text-xs font-medium text-gray-700">{s.offerId?.name}</p>
                                {s.couponId && (
                                  <p className="text-xs font-mono text-brand">{s.couponId.code}</p>
                                )}
                              </div>
                            )}
                            <button
                              onClick={() => confirmDelete(s)}
                              className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                              title="Delete session"
                            >🗑️</button>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {!loading && data.history.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">No game history yet</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-4 pb-4">
          <Pagination
            page={page} totalPages={data.totalPages} onPageChange={setPage}
            perPage={perPage} onPerPageChange={p => { setPerPage(p); setPage(1); }}
          />
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="text-3xl text-center mb-3">🗑️</div>
            <h3 className="text-base font-bold text-gray-900 text-center mb-1">Delete Session?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">
              This will permanently delete the <strong>{deleteTarget.gameName}</strong> session record.
              The player's play-limit lock will also be cleared, allowing them to play again.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >Cancel</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-60"
              >{deleting ? 'Deleting...' : 'Yes, Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
