import React, { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import { format } from 'date-fns';

const GAME_ICONS = { spin_wheel: '🎡', scratch_card: '🃏', catch_popcorn: '🍿' };

function StarDisplay({ value, max = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className="text-base"
          style={{
            filter: i < value
              ? 'drop-shadow(0 0 2px rgba(250,204,21,0.6))'
              : 'grayscale(1) opacity(0.3)',
          }}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}

function RatingBadge({ value }) {
  if (!value) return <span className="text-xs text-gray-300">—</span>;
  const colors = [
    '', 'bg-red-100 text-red-600', 'bg-orange-100 text-orange-600',
    'bg-yellow-100 text-yellow-700', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700'
  ];
  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${colors[value]}`}>
      ⭐ {value} <span className="font-normal opacity-70">{labels[value]}</span>
    </span>
  );
}

function AvgCircle({ value }) {
  if (!value) return null;
  const pct = (value / 5) * 100;
  const color = value >= 4 ? '#22c55e' : value >= 3 ? '#f59e0b' : '#ef4444';
  const r = 16, circ = 2 * Math.PI * r;
  return (
    <div className="relative flex-shrink-0" style={{ width: 44, height: 44 }}>
      <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="22" cy="22" r={r} fill="none" stroke="#f3f4f6" strokeWidth="4" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={circ - (pct / 100) * circ}
          strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-black text-gray-800" style={{ lineHeight: 1 }}>{value.toFixed(1)}</span>
        <span className="text-[9px] text-gray-400">/ 5</span>
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const [data, setData]       = useState({ reviews: [], total: 0, totalPages: 1 });
  const [page, setPage]       = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [search, setSearch]   = useState('');
  const [from, setFrom]       = useState('');
  const [to, setTo]           = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (overrides = {}) => {
    setLoading(true);
    try {
      const params = { page, limit: perPage, search, from, to, ...overrides };
      const r = await api.get('/feedback', { params });
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

  // Compute avg rating per row
  const avg = (s) => {
    const vals = [s.feedback?.gameRating, s.feedback?.offerRating, s.feedback?.enjoymentRating].filter(Boolean);
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  // Summary stats
  const allAvgs = data.reviews.map(avg).filter(Boolean);
  const overallAvg = allAvgs.length ? (allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length) : null;
  const totalWith5 = data.reviews.filter(r => avg(r) === 5).length;

  return (
    <div className="p-6">
      <PageHeader title="Reviews & Feedback" subtitle="Customer ratings from all game sessions" />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center text-xl">⭐</div>
          <div>
            <p className="text-2xl font-black text-gray-900">{overallAvg ? overallAvg.toFixed(1) : '—'}</p>
            <p className="text-xs text-gray-400">Avg Rating (this page)</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl">💬</div>
          <div>
            <p className="text-2xl font-black text-gray-900">{data.total}</p>
            <p className="text-xs text-gray-400">Total Reviews</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-xl">🏆</div>
          <div>
            <p className="text-2xl font-black text-gray-900">{totalWith5}</p>
            <p className="text-xs text-gray-400">Perfect 5★ (this page)</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3">
        <input
          className="input flex-1 min-w-40"
          placeholder="Search by name or phone"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 whitespace-nowrap">From</span>
          <input className="input w-36" type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 whitespace-nowrap">To</span>
          <input className="input w-36" type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={handleSearch}>Search</button>
        <button className="btn-secondary" onClick={handleClear}>Clear</button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading && <div className="text-center py-3 text-sm text-gray-400">Loading...</div>}
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['#', 'Customer', 'Game', '🎮 Game', '🎁 Offer', '😄 Enjoyment', 'Avg', 'Comment', 'Date', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.reviews.map((row, i) => {
              const a = avg(row);
              return (
                <tr key={row._id} className="hover:bg-gray-50 transition-colors">
                  {/* # */}
                  <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * perPage + i + 1}</td>

                  {/* Customer */}
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-800 text-sm">{row.customerId?.name || '—'}</p>
                    <p className="text-xs text-gray-400">{row.customerId?.phone || ''}</p>
                  </td>

                  {/* Game */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{GAME_ICONS[row.gameId?.key] || '🎮'}</span>
                      <span className="text-xs font-medium text-gray-600">{row.gameId?.name || '—'}</span>
                    </div>
                  </td>

                  {/* Game rating */}
                  <td className="px-4 py-3">
                    <RatingBadge value={row.feedback?.gameRating} />
                  </td>

                  {/* Offer rating */}
                  <td className="px-4 py-3">
                    <RatingBadge value={row.feedback?.offerRating} />
                  </td>

                  {/* Enjoyment rating */}
                  <td className="px-4 py-3">
                    <RatingBadge value={row.feedback?.enjoymentRating} />
                  </td>

                  {/* Avg circle */}
                  <td className="px-4 py-3">
                    <AvgCircle value={a} />
                  </td>

                  {/* Comment */}
                  <td className="px-4 py-3 max-w-xs">
                    {row.feedback?.comment
                      ? <p className="text-xs text-gray-600 italic truncate max-w-[160px]" title={row.feedback.comment}>"{row.feedback.comment}"</p>
                      : <span className="text-xs text-gray-300">—</span>
                    }
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {row.feedback?.submittedAt
                      ? format(new Date(row.feedback.submittedAt), 'dd MMM yy, HH:mm')
                      : '—'}
                  </td>

                  {/* Star visual */}
                  <td className="px-4 py-3">
                    {a && <StarDisplay value={Math.round(a)} />}
                  </td>
                </tr>
              );
            })}
            {!loading && data.reviews.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-12">
                  <div className="text-4xl mb-2">📝</div>
                  <p className="text-gray-400 text-sm">No feedback submitted yet</p>
                  <p className="text-gray-300 text-xs mt-1">Feedback appears here once customers rate their experience</p>
                </td>
              </tr>
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
    </div>
  );
}
