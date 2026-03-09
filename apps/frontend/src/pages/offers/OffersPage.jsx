import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import TipTapEditor from '../../components/TipTapEditor';

const emptyForm = { name: '', shortDescription: '', description: '', validityDays: 30, discountType: 'percentage', discountValue: '', autoGenerateCoupon: true, startDate: '', image: null };

export default function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editOffer, setEditOffer] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteOffer, setDeleteOffer] = useState(null);
  const [affectedGames, setAffectedGames] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/offers').then(r => setOffers(r.data));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditOffer(null); setShowModal(true); };
  const openEdit = (o) => {
    setEditOffer(o);
    setForm({ name: o.name, shortDescription: o.shortDescription, description: o.description, validityDays: o.validityDays, discountType: o.discountType, discountValue: o.discountValue, autoGenerateCoupon: o.autoGenerateCoupon, startDate: o.startDate?.split('T')[0] || '', image: null });
    setShowModal(true);
  };
  const openDelete = async (o) => {
    setDeleteOffer(o);
    const r = await api.get(`/offers/${o._id}/games`);
    setAffectedGames(r.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (k !== 'image' && v !== null) fd.append(k, v); });
      if (form.image) fd.append('image', form.image);
      if (editOffer) {
        await api.patch(`/offers/${editOffer._id}`, fd);
        toast.success('Offer updated. Future plays will use new settings.');
      } else {
        await api.post('/offers', fd);
        toast.success('Offer created!');
      }
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/offers/${deleteOffer._id}`);
      toast.success('Offer deleted');
      setDeleteOffer(null); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  return (
    <div className="p-6">
      <PageHeader title="Offers" subtitle="Create and manage promotional offers" action={
        <button className="btn-primary" onClick={openCreate}>+ New Offer</button>
      } />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.map(o => (
          <div key={o._id} className="card p-4">
            {o.imageUrl && <img src={o.imageUrl} alt={o.name} className="w-full h-32 object-cover rounded-lg mb-3" />}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{o.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{o.shortDescription}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 ${o.isActive ? 'badge-active' : 'bg-gray-100 text-gray-500'}`}>
                {o.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">
                {o.discountType === 'percentage' ? `${o.discountValue}% off` : `₹${o.discountValue} off`}
              </span>
              <span>Valid {o.validityDays} days</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => openEdit(o)} className="btn-secondary flex-1 text-xs py-1.5">Edit</button>
              <button onClick={() => openDelete(o)} className="btn-danger flex-1 text-xs py-1.5">Delete</button>
            </div>
          </div>
        ))}
        {offers.length === 0 && <div className="col-span-3 text-center py-12 text-gray-400">No offers yet. Create your first offer!</div>}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editOffer ? 'Edit Offer' : 'New Offer'} size="lg">
        {editOffer && <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">⚠️ Changes apply to future plays only. Existing coupons remain unchanged.</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Offer Name</label><input className="input" required value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} /></div>
            <div className="col-span-2"><label className="label">Short Description</label><input className="input" required value={form.shortDescription} onChange={e => setForm(p=>({...p,shortDescription:e.target.value}))} /></div>
            <div><label className="label">Discount Type</label>
              <select className="input" value={form.discountType} onChange={e => setForm(p=>({...p,discountType:e.target.value}))}>
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            <div><label className="label">Discount Value</label><input className="input" type="number" required min="0" value={form.discountValue} onChange={e => setForm(p=>({...p,discountValue:e.target.value}))} /></div>
            <div><label className="label">Validity (Days)</label><input className="input" type="number" min="1" value={form.validityDays} onChange={e => setForm(p=>({...p,validityDays:e.target.value}))} /></div>
            <div><label className="label">Start Date</label><input className="input" type="date" value={form.startDate} onChange={e => setForm(p=>({...p,startDate:e.target.value}))} /></div>
            <div className="col-span-2">
              <label className="label">Offer Image</label>
              <input className="input" type="file" accept="image/*" onChange={e => setForm(p=>({...p,image:e.target.files[0]}))} />
            </div>
            <div className="col-span-2">
              <label className="label">Full Description</label>
              <TipTapEditor value={form.description} onChange={v => setForm(p=>({...p,description:v}))} />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="autoCoupon" checked={form.autoGenerateCoupon} onChange={e => setForm(p=>({...p,autoGenerateCoupon:e.target.checked}))} />
              <label htmlFor="autoCoupon" className="text-sm text-gray-700">Auto-generate coupon on win</label>
            </div>
          </div>
          <button className="btn-primary w-full" disabled={saving}>{saving ? 'Saving...' : editOffer ? 'Update Offer' : 'Create Offer'}</button>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteOffer} onClose={() => setDeleteOffer(null)} title="Delete Offer" size="sm">
        <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete <strong>{deleteOffer?.name}</strong>?</p>
        {affectedGames.length > 0 && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-xs font-medium text-orange-700 mb-1">This offer is used in {affectedGames.length} game(s):</p>
            {affectedGames.map(g => <p key={g._id} className="text-xs text-orange-600">• {g.gameId?.name}</p>)}
            <p className="text-xs text-orange-700 mt-1">These games will have this offer removed. Games with no offers left will be disabled.</p>
          </div>
        )}
        <div className="flex gap-2">
          <button className="btn-secondary flex-1" onClick={() => setDeleteOffer(null)}>Cancel</button>
          <button className="btn-danger flex-1" onClick={handleDelete}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
