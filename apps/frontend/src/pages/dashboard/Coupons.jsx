import { useEffect, useState } from 'react';
import { Ticket, Plus, Trash2, Loader2, Gift } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Modal from '@/components/ui/modal';
import EmptyState from '@/components/shared/EmptyState';
import api from '@/lib/api';

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [redeemResult, setRedeemResult] = useState(null);
  const [form, setForm] = useState({ code: '', description: '', pointsRequired: 100, discountType: 'percent', discountValue: 10, usageLimit: 1, expiresAt: '' });
  const [redeemForm, setRedeemForm] = useState({ code: '', playerId: '' });

  const fetchCoupons = async () => {
    try { const { data } = await api.get('/coupons'); setCoupons(data); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.post('/coupons', { ...form, expiresAt: form.expiresAt || undefined }); setForm({ code: '', description: '', pointsRequired: 100, discountType: 'percent', discountValue: 10, usageLimit: 1, expiresAt: '' }); setAddOpen(false); fetchCoupons(); }
    finally { setSaving(false); }
  };

  const handleRedeem = async (e) => {
    e.preventDefault(); setSaving(true); setRedeemResult(null);
    try { const { data } = await api.post('/coupons/redeem', redeemForm); setRedeemResult({ success: true, message: data.message, discount: data.discount }); fetchCoupons(); }
    catch (err) { setRedeemResult({ success: false, message: err.response?.data?.error || 'Redemption failed' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => { if (!confirm('Delete this coupon?')) return; await api.delete(`/coupons/${id}`); fetchCoupons(); };
  const isExpired = (date) => date && new Date(date) < new Date();

  return (
    <div className="p-6 lg:p-8">
      <PageHeader title="Coupons" subtitle="Create and manage reward coupons for players"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setRedeemOpen(true); setRedeemResult(null); }}><Gift className="w-4 h-4 mr-2" /> Redeem</Button>
            <Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-2" /> New Coupon</Button>
          </div>
        }
      />
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
        ) : coupons.length === 0 ? (
          <EmptyState icon={Ticket} title="No coupons yet" description="Create reward coupons that players can redeem with their points"
            action={<Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-2" />New Coupon</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Code</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Discount</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Points Req.</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Usage</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.map(coupon => (
                  <tr key={coupon._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5"><p className="font-mono font-semibold text-gray-900 tracking-wide">{coupon.code}</p>{coupon.description && <p className="text-xs text-gray-400 mt-0.5">{coupon.description}</p>}</td>
                    <td className="px-5 py-3.5"><Badge variant="green">{coupon.discountValue}{coupon.discountType === 'percent' ? '%' : '₹'} off</Badge></td>
                    <td className="px-5 py-3.5"><div className="flex items-center gap-1"><Ticket className="w-3.5 h-3.5 text-indigo-400" /><span className="font-semibold text-gray-700">{coupon.pointsRequired}</span></div></td>
                    <td className="px-5 py-3.5 text-gray-600">{coupon.usedCount} / {coupon.usageLimit}</td>
                    <td className="px-5 py-3.5">
                      {isExpired(coupon.expiresAt) ? <Badge variant="red">Expired</Badge> :
                        coupon.usedCount >= coupon.usageLimit ? <Badge variant="default">Exhausted</Badge> :
                        coupon.isActive ? <Badge variant="green">Active</Badge> : <Badge variant="default">Inactive</Badge>}
                    </td>
                    <td className="px-5 py-3.5 text-right"><Button size="sm" variant="ghost" onClick={() => handleDelete(coupon._id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Create New Coupon" size="lg">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-sm font-medium text-gray-700">Coupon Code *</label>
              <Input placeholder="SAVE20" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required /></div>
            <div className="space-y-1"><label className="text-sm font-medium text-gray-700">Points Required *</label>
              <Input type="number" min="1" value={form.pointsRequired} onChange={e => setForm(f => ({ ...f, pointsRequired: Number(e.target.value) }))} required /></div>
          </div>
          <div className="space-y-1"><label className="text-sm font-medium text-gray-700">Description</label>
            <Input placeholder="20% off on next purchase" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-sm font-medium text-gray-700">Discount Type</label>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {['percent', 'flat'].map(t => (
                  <button key={t} type="button" onClick={() => setForm(f => ({ ...f, discountType: t }))}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${ form.discountType === t ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50' }`}>
                    {t === 'percent' ? '% Percent' : '₹ Flat'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1"><label className="text-sm font-medium text-gray-700">Discount Value *</label>
              <Input type="number" min="1" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-sm font-medium text-gray-700">Usage Limit</label>
              <Input type="number" min="1" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: Number(e.target.value) }))} /></div>
            <div className="space-y-1"><label className="text-sm font-medium text-gray-700">Expiry Date</label>
              <Input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Coupon'}</Button>
          </div>
        </form>
      </Modal>
      <Modal open={redeemOpen} onClose={() => setRedeemOpen(false)} title="Redeem Coupon" size="sm">
        <form onSubmit={handleRedeem} className="space-y-4">
          <div className="space-y-1"><label className="text-sm font-medium text-gray-700">Coupon Code</label>
            <Input placeholder="SAVE20" value={redeemForm.code} onChange={e => setRedeemForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required /></div>
          <div className="space-y-1"><label className="text-sm font-medium text-gray-700">Player ID</label>
            <Input placeholder="Player MongoDB ID" value={redeemForm.playerId} onChange={e => setRedeemForm(f => ({ ...f, playerId: e.target.value }))} required /></div>
          {redeemResult && (
            <div className={`rounded-lg px-4 py-3 text-sm font-medium ${ redeemResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200' }`}>
              {redeemResult.message}{redeemResult.discount && <p className="text-xs mt-0.5 opacity-75">Discount: {redeemResult.discount}</p>}
            </div>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setRedeemOpen(false)}>Close</Button>
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Redeem'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
