import React, { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';

export default function CustomersPage() {
  const [data, setData] = useState({ customers: [], total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (overrides = {}) => {
    setLoading(true);
    try {
      const params = { page, limit: perPage, search, ...overrides };
      const r = await api.get('/customers', { params });
      setData(r.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search]);

  useEffect(() => { load(); }, [page, perPage]);

  const handleSearch = () => { setPage(1); load({ page: 1 }); };
  const handleClear = () => { setSearch(''); setPage(1); load({ search: '', page: 1 }); };

  return (
    <div className="p-6">
      <PageHeader title="Customers" subtitle={`${data.total} total customers`} />

      <div className="card p-4 mb-4 flex gap-3">
        <input
          className="input flex-1"
          placeholder="Search by name or phone"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <button className="btn-primary" onClick={handleSearch}>Search</button>
        <button className="btn-secondary" onClick={handleClear}>Clear</button>
      </div>

      <div className="card overflow-hidden">
        {loading && (
          <div className="text-center py-4 text-sm text-gray-400">Loading...</div>
        )}
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['#', 'Name', 'Phone', 'Games Played', 'Offers Redeemed'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.customers.map((c, i) => (
              <tr key={c._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{(page - 1) * perPage + i + 1}</td>
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-gray-500">{c.phone}</td>
                <td className="px-4 py-3">{c.totalGamesPlayed}</td>
                <td className="px-4 py-3">
                  <span className="font-medium text-green-600">{c.totalOffersRedeemed}</span>
                  <span className="text-gray-400"> / {c.totalOffersObtained}</span>
                </td>
              </tr>
            ))}
            {!loading && data.customers.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">No customers yet</td></tr>
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
