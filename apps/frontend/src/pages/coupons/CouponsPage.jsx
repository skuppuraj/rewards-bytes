import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import { format, differenceInDays } from 'date-fns';

export default function CouponsPage() {
  const [data, setData] = useState({ coupons: [], total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [filters, setFilters] = useState({ from: '', to: '', code: '', name: '', mobile: '', status: '' });
  const [redeemModal, setRedeemModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [additionalDays, setAdditionalDays] = useState(7);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('games');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (overrides = {}) => {
    setLoading(true);
    try {
      const params = { page, limit: perPage, ...filters, ...overrides };
      const r = await api.get('/coupons', { params });
      setData(r.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, perPage, filters]);

  useEffect(() => { load(); }, [page, perPage]);

  const handleApplyFilters = () => { setPage(1); load({ page: 1 }); };
  const handleClearFilters = () => {
    const cleared = { from: '', to: '', code: '', name: '', mobile: '', status: '' };
    setFilters(cleared);
    setPage(1);
    load({ ...cleared, page: 1 });
  };

  const openRedeem = async (coupon) => {
    setRedeemModal(coupon);
    setActiveTab('games');
    try {
      const r = await api.get('/game-history', { params: { search: coupon.customerId?.phone, limit: 100 } });
      const customerRow = r.data.history?.find(h => h.customer?.phone === coupon.customerId?.phone);
      setCustomerDetails(customerRow || null);
    } catch { setCustomerDetails(null); }
  };

  const handleRedeem = async () => {
    try {
      await api.post(`/coupons/${redeemModal._id}/redeem`);
      toast.success('Coupon redeemed!');
      setRedeemModal(null);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleExtend = async () => {
    try {
      await api.patch(`/coupons/${editModal._id}`, { additionalDays });
      toast.success('Validity extended!');
      setEditModal(null);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try { await api.delete(`/coupons/${id}`); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleNotify = async (coupon) => {
    try { await api.post(`/coupons/${coupon._id}/notify`, {}); toast.success('Notification sent!'); }
    catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const daysRemaining = (exp) => {
    const d = differenceInDays(new Date(exp), new Date());
    return d > 0 ? `${d} days` : 'Expired';
  };

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Coupons" subtitle={`${data.total} total coupons`} />

      {/* Filters — 2-col on mobile, 3-col on md, 6-col on lg */}
      <div className="card p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <input className="input" type="date" placeholder="From" value={filters.from} onChange={e => setFilters(p => ({ ...p, from: e.target.value }))} />
          <input className="input" type="date" placeholder="To" value={filters.to} onChange={e => setFilters(p => ({ ...p, to: e.target.value }))} />
          <input className="input" placeholder="Coupon code" value={filters.code} onChange={e => setFilters(p => ({ ...p, code: e.target.value }))} />
          <input className="input" placeholder="Customer name" value={filters.name} onChange={e => setFilters(p => ({ ...p, name: e.target.value }))} />
          <input className="input" placeholder="Mobile number" value={filters.mobile} onChange={e => setFilters(p => ({ ...p, mobile: e.target.value }))} />
          <select className="input" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="redeemed">Redeemed</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div className="flex gap-2 mt-3">
          <button className="btn-primary" onClick={handleApplyFilters}>Apply Filters</button>
          <button className="btn-secondary" onClick={handleClearFilters}>Clear</button>
        </div>
      </div>

      {/* overflow-x-auto fixes hidden table on mobile */}
      <div className="card overflow-hidden">
        {loading && <div className="text-center py-3 text-sm text-gray-400">Loading...</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['#', 'Code', 'Customer', 'Offer', 'Start', 'Expires', 'Days Left', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.coupons.map((c, i) => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{(page - 1) * perPage + i + 1}</td>
                  <td className="px-4 py-3 font-mono font-bold text-brand whitespace-nowrap">{c.code}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium whitespace-nowrap">{c.customerId?.name}</p>
                    <p className="text-xs text-gray-400">{c.customerId?.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{c.offerId?.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{c.startDate ? format(new Date(c.startDate), 'dd MMM yy') : '-'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{c.expiresAt ? format(new Date(c.expiresAt), 'dd MMM yy') : '-'}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">{daysRemaining(c.expiresAt)}</td>
                  <td className="px-4 py-3"><span className={`badge-${c.status}`}>{c.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-nowrap">
                      {c.status === 'active' && <button onClick={() => openRedeem(c)} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100 whitespace-nowrap">Redeem</button>}
                      <button onClick={() => { setEditModal(c); setAdditionalDays(7); }} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100">Extend</button>
                      <button onClick={() => handleNotify(c)} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded hover:bg-purple-100">Notify</button>
                      <button onClick={() => handleDelete(c._id)} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100">Del</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && data.coupons.length === 0 && (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">No coupons found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4">
          <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage}
            perPage={perPage} onPerPageChange={p => { setPerPage(p); setPage(1); }} />
        </div>
      </div>

      {/* Redeem Modal */}
      <Modal open={!!redeemModal} onClose={() => setRedeemModal(null)} title="Redeem Coupon" size="lg">
        {redeemModal && (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
              <div><p className="text-xs text-gray-500">Customer</p><p className="font-semibold">{redeemModal.customerId?.name}</p></div>
              <div><p className="text-xs text-gray-500">Phone</p><p className="font-semibold">{redeemModal.customerId?.phone}</p></div>
              <div><p className="text-xs text-gray-500">Coupon Code</p><p className="font-mono font-bold text-brand">{redeemModal.code}</p></div>
              <div><p className="text-xs text-gray-500">Expires</p><p className="font-semibold">{redeemModal.expiresAt ? format(new Date(redeemModal.expiresAt), 'dd MMM yyyy') : '-'}</p></div>
            </div>
            <div className="flex border-b border-gray-100 mb-4">
              {['games', 'offers'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${ activeTab === tab ? 'border-brand text-brand' : 'border-transparent text-gray-500' }`}>
                  {tab === 'games' ? 'Games Played' : 'Offers Received'}
                </button>
              ))}
            </div>
            {activeTab === 'games' && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {customerDetails?.sessions?.length > 0
                  ? customerDetails.sessions.map(s => (
                    <div key={s._id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                      <span className="font-medium">{s.gameId?.name}</span>
                      <span className="text-gray-400">{s.startedAt ? format(new Date(s.startedAt), 'dd MMM, HH:mm') : ''}</span>
                      <span className={`badge-${s.status}`}>{s.status}</span>
                    </div>
                  ))
                  : <p className="text-xs text-gray-400 text-center py-4">No games found</p>
                }
              </div>
            )}
            {activeTab === 'offers' && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {customerDetails?.sessions?.filter(s => s.offerId).length > 0
                  ? customerDetails.sessions.filter(s => s.offerId).map(s => (
                    <div key={s._id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                      <span className="font-medium">{s.offerId?.name}</span>
                      {s.couponId && <span className="font-mono text-brand">{s.couponId.code}</span>}
                      {s.couponId && <span className={`badge-${s.couponId.status}`}>{s.couponId.status}</span>}
                    </div>
                  ))
                  : <p className="text-xs text-gray-400 text-center py-4">No offers received</p>
                }
              </div>
            )}
            <button className="btn-primary w-full mt-4" onClick={handleRedeem}>✅ Confirm Redeem</button>
          </div>
        )}
      </Modal>

      {/* Extend Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Extend Validity" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Coupon: <strong className="font-mono text-brand">{editModal?.code}</strong></p>
          <div>
            <label className="label">Add Days</label>
            <input className="input" type="number" min="1" value={additionalDays} onChange={e => setAdditionalDays(e.target.value)} />
          </div>
          <button className="btn-primary w-full" onClick={handleExtend}>Extend Validity</button>
        </div>
      </Modal>
    </div>
  );
}
