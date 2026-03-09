import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';

const emptyForm = { name: '', email: '', password: '', permissions: { canRedeemCoupons: true, canViewCustomers: true } };

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/staff').then(r => setStaff(r.data));
  useEffect(load, []);

  const openCreate = () => { setForm(emptyForm); setEditStaff(null); setShowModal(true); };
  const openEdit = (s) => { setEditStaff(s); setForm({ name: s.name, email: s.email, password: '', permissions: s.permissions }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editStaff) {
        await api.patch(`/staff/${editStaff._id}`, form);
        toast.success('Staff updated');
      } else {
        await api.post('/staff', form);
        toast.success('Staff account created');
      }
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this staff account?')) return;
    try { await api.delete(`/staff/${id}`); toast.success('Staff deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  return (
    <div className="p-6">
      <PageHeader title="Staff" subtitle="Manage staff accounts for coupon redemption" action={
        <button className="btn-primary" onClick={openCreate}>+ Add Staff</button>
      } />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['#', 'Name', 'Email', 'Permissions', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {staff.map((s, i) => (
              <tr key={s._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-gray-500">{s.email}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {s.permissions?.canRedeemCoupons && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Redeem</span>}
                    {s.permissions?.canViewCustomers && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Customers</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={s.isActive ? 'badge-active' : 'badge-expired'}>{s.isActive ? 'Active' : 'Inactive'}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(s)} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100">Edit</button>
                    <button onClick={() => handleDelete(s._id)} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">No staff accounts yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editStaff ? 'Edit Staff' : 'Add Staff'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Name</label><input className="input" required value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} /></div>
          <div><label className="label">Email</label><input className="input" type="email" required value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} /></div>
          <div><label className="label">{editStaff ? 'New Password (leave blank to keep)' : 'Password'}</label>
            <input className="input" type="password" required={!editStaff} value={form.password} onChange={e => setForm(p=>({...p,password:e.target.value}))} />
          </div>
          <div>
            <label className="label">Permissions</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.permissions.canRedeemCoupons} onChange={e => setForm(p=>({...p,permissions:{...p.permissions,canRedeemCoupons:e.target.checked}}))} />Can redeem coupons</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.permissions.canViewCustomers} onChange={e => setForm(p=>({...p,permissions:{...p.permissions,canViewCustomers:e.target.checked}}))} />Can view customers</label>
            </div>
          </div>
          <button className="btn-primary w-full" disabled={saving}>{saving ? 'Saving...' : editStaff ? 'Update Staff' : 'Create Staff'}</button>
        </form>
      </Modal>
    </div>
  );
}
