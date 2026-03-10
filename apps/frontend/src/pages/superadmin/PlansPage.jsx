import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import superAdminApi from '../../lib/superAdminApi';

const EMPTY = { name: '', price: '', durationDays: '', isTrial: false, trialDays: '', isActive: true, description: '', features: '' };

export default function PlansPage() {
  const [plans, setPlans]   = useState([]);
  const [form, setForm]     = useState(EMPTY);
  const [editing, setEditing] = useState(null); // plan _id
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = () => superAdminApi.get('/superadmin/plans').then(r => setPlans(r.data)).catch(() => toast.error('Failed to load plans'));
  useEffect(() => { load(); }, []);

  const openNew  = () => { setForm(EMPTY); setEditing(null); setShowForm(true); };
  const openEdit = (p) => {
    setForm({ ...p, price: p.price / 100, features: (p.features || []).join('\n') });
    setEditing(p._id); setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        price:        Math.round(parseFloat(form.price || 0) * 100),  // store in paise
        durationDays: parseInt(form.durationDays || 0),
        trialDays:    parseInt(form.trialDays || 0),
        features:     form.features ? form.features.split('\n').map(f => f.trim()).filter(Boolean) : [],
      };
      if (editing) {
        await superAdminApi.patch(`/superadmin/plans/${editing}`, payload);
        toast.success('Plan updated');
      } else {
        await superAdminApi.post('/superadmin/plans', payload);
        toast.success('Plan created');
      }
      setShowForm(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (p) => {
    try {
      await superAdminApi.patch(`/superadmin/plans/${p._id}`, { isActive: !p.isActive });
      toast.success(`Plan ${!p.isActive ? 'enabled' : 'disabled'}`);
      load();
    } catch { toast.error('Failed to update'); }
  };

  const deletePlan = async (p) => {
    if (!confirm(`Delete plan "${p.name}"?`)) return;
    try { await superAdminApi.delete(`/superadmin/plans/${p._id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black">Plans</h1>
            <p className="text-gray-400 text-sm mt-1">Manage subscription plans for organizations</p>
          </div>
          <button onClick={openNew} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl text-sm font-bold">+ New Plan</button>
        </div>

        {/* Plan cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {plans.map(p => (
            <div key={p._id} className={`bg-gray-900 border rounded-2xl p-5 flex flex-col gap-3 ${ p.isActive ? 'border-gray-700' : 'border-gray-800 opacity-50' }`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-lg text-white">{p.name}</p>
                  {p.isTrial && <span className="text-xs bg-yellow-900/60 text-yellow-400 px-2 py-0.5 rounded-full">Trial</span>}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-purple-400">
                    {p.price === 0 ? 'Free' : `₹${(p.price/100).toLocaleString()}`}
                  </p>
                  <p className="text-xs text-gray-500">{p.durationDays} days</p>
                </div>
              </div>
              {p.description && <p className="text-xs text-gray-400">{p.description}</p>}
              {p.features?.length > 0 && (
                <ul className="space-y-1">
                  {p.features.map((f, i) => <li key={i} className="text-xs text-gray-300 flex gap-1.5"><span className="text-green-400">✓</span>{f}</li>)}
                </ul>
              )}
              <div className="flex gap-2 mt-auto pt-2">
                <button onClick={() => openEdit(p)} className="flex-1 text-xs py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700">Edit</button>
                <button onClick={() => toggleActive(p)} className={`flex-1 text-xs py-1.5 rounded-lg font-semibold ${ p.isActive ? 'bg-yellow-900/50 text-yellow-400 hover:bg-yellow-900' : 'bg-green-900/50 text-green-400 hover:bg-green-900' }`}>
                  {p.isActive ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => deletePlan(p)} className="px-2 text-xs py-1.5 rounded-lg bg-red-900/50 text-red-400 hover:bg-red-900">🗑</button>
              </div>
            </div>
          ))}
          {plans.length === 0 && <div className="col-span-3 text-center py-16 text-gray-500">No plans yet. Create one!</div>}
        </div>

        {/* Form modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
              <h2 className="font-bold text-lg mb-5">{editing ? 'Edit Plan' : 'New Plan'}</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Plan Name *</label>
                  <input className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
                    value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="e.g. Starter" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Price (INR) *</label>
                    <input type="number" min="0" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
                      value={form.price} onChange={e => setForm(p => ({...p, price: e.target.value}))} placeholder="0 for free" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Duration (days) *</label>
                    <input type="number" min="1" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
                      value={form.durationDays} onChange={e => setForm(p => ({...p, durationDays: e.target.value}))} placeholder="30" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isTrial} onChange={e => setForm(p => ({...p, isTrial: e.target.checked}))}
                      className="w-4 h-4 accent-purple-500" />
                    <span className="text-sm text-gray-300">Trial Plan</span>
                  </label>
                  {form.isTrial && (
                    <input type="number" min="1" className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
                      value={form.trialDays} onChange={e => setForm(p => ({...p, trialDays: e.target.value}))} placeholder="Trial days" />
                  )}
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Description</label>
                  <input className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
                    value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="Short description" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Features (one per line)</label>
                  <textarea rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-purple-500 resize-none"
                    value={form.features} onChange={e => setForm(p => ({...p, features: e.target.value}))} placeholder="Unlimited games\nEmail support\nQR code" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({...p, isActive: e.target.checked}))} className="w-4 h-4 accent-purple-500" />
                  <span className="text-sm text-gray-300">Active (visible to orgs)</span>
                </label>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold text-sm disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update Plan' : 'Create Plan'}
                </button>
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
