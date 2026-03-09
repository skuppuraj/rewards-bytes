import React, { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import { format } from 'date-fns';

export default function GameHistoryPage() {
  const [data, setData] = useState({ history: [], total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (overrides = {}) => {
    setLoading(true);
    try {
      const params = { page, limit: perPage, search, from, to, ...overrides };
      const r = await api.get('/game-history', { params });
      setData(r.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, from, to]);

  useEffect(() => { load(); }, [page, perPage]);

  const handleSearch = () => { setPage(1); load({ page: 1 }); };
  const handleClear = () => {
    setSearch(''); setFrom(''); setTo('');
    setPage(1);
    load({ search: '', from: '', to: '', page: 1 });
  };

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  return (
    <div className="p-6">
      <PageHeader title="Game History" subtitle="All customer play sessions" />

      <div className="card p-4 mb-4 flex flex-wrap gap-3">
        <input className="input flex-1 min-w-40" placeholder="Search by name or phone" value={search}
          onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        <input className="input w-36" type="date" value={from} onChange={e => setFrom(e.target.value)} />
        <input className="input w-36" type="date" value={to} onChange={e => setTo(e.target.value)} />
        <button className="btn-primary" onClick={handleSearch}>Search</button>
        <button className="btn-secondary" onClick={handleClear}>Clear</button>
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
                    <td colSpan={6} className="px-6 py-3 bg-primary-50">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-2">Games Played</p>
                          {row.sessions.map(s => (
                            <div key={s._id} className="text-xs text-gray-600 mb-1 flex items-center gap-2">
                              <span className="font-medium">{s.gameId?.name}</span>
                              <span className="text-gray-400">{s.startedAt ? format(new Date(s.startedAt), 'dd MMM, HH:mm') : ''}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-2">Offers Received</p>
                          {row.sessions.filter(s => s.offerId).map(s => (
                            <div key={s._id} className="text-xs text-gray-600 mb-1 flex items-center gap-2">
                              <span className="font-medium">{s.offerId?.name}</span>
                              {s.couponId && <span className="font-mono text-brand">{s.couponId.code}</span>}
                            </div>
                          ))}
                          {!row.sessions.some(s => s.offerId) && <p className="text-xs text-gray-400">No offers received</p>}
                        </div>
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
            page={page}
            totalPages={data.totalPages}
            onPageChange={setPage}
            perPage={perPage}
            onPerPageChange={p => { setPerPage(p); setPage(1); }}
          />
        </div>
      </div>
    </div>
  );
}
