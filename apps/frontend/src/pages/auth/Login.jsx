import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [resending, setResending] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUnverifiedEmail(null);
    setLoading(true);
    try {
      const r = await api.post('/auth/login', form);
      setAuth(r.data.token, r.data.user, r.data.org);
      navigate('/dashboard');
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.error === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(errData.email || form.email);
      } else {
        toast.error(errData?.error || 'Login failed');
      }
    } finally { setLoading(false); }
  };

  const resend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email: unverifiedEmail });
      toast.success('Verification email sent! Check your inbox.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend');
    } finally { setResending(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
      <div className="card p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">R</div>
          <h1 className="text-xl font-bold">RewardBytes</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your dashboard</p>
        </div>

        {/* Unverified email banner */}
        {unverifiedEmail && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-sm font-semibold text-yellow-800 mb-1">📧 Email not verified</p>
            <p className="text-xs text-yellow-700 mb-3">
              Please verify <strong>{unverifiedEmail}</strong> before logging in.
            </p>
            <button
              onClick={resend}
              disabled={resending}
              className="w-full py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-white text-xs font-bold transition-colors disabled:opacity-50">
              {resending ? 'Sending...' : '🔄 Resend verification email'}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          </div>
          <button className="btn-primary w-full py-2.5" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          No account? <Link to="/signup" className="text-brand font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
