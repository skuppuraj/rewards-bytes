import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function Signup() {
  const [form, setForm] = useState({ orgName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/signup', form);
      toast.success('Account created! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
      <div className="card p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">R</div>
          <h1 className="text-xl font-bold">RewardBytes</h1>
          <p className="text-gray-500 text-sm mt-1">Create your organization</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Organization Name</label><input className="input" required value={form.orgName} onChange={e => setForm(p => ({...p, orgName: e.target.value}))} /></div>
          <div><label className="label">Email</label><input className="input" type="email" required value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} /></div>
          <div><label className="label">Password</label><input className="input" type="password" required minLength={6} value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} /></div>
          <button className="btn-primary w-full py-2.5" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">Have account? <Link to="/login" className="text-brand font-medium">Sign in</Link></p>
      </div>
    </div>
  );
}
