import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';

// Step 1 — Signup form
function SignupForm({ onSuccess }) {
  const [form, setForm] = useState({ orgName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/signup', form);
      onSuccess(form.email);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed');
    } finally { setLoading(false); }
  };

  return (
    <>
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">R</div>
        <h1 className="text-xl font-bold">RewardBytes</h1>
        <p className="text-gray-500 text-sm mt-1">Create your organization</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Organization Name</label>
          <input className="input" required value={form.orgName}
            onChange={e => setForm(p => ({ ...p, orgName: e.target.value }))} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" required value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" required minLength={6} value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
        </div>
        <button className="btn-primary w-full py-2.5" disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        Have account? <Link to="/login" className="text-brand font-medium">Sign in</Link>
      </p>
    </>
  );
}

// Step 2 — Check email
function CheckEmail({ email, onResent }) {
  const [resending, setResending] = useState(false);

  const resend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email });
      toast.success('Verification email resent!');
      onResent && onResent();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend');
    } finally { setResending(false); }
  };

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
        📧
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">Check your email</h2>
      <p className="text-sm text-gray-500 mb-1">We sent a verification link to:</p>
      <p className="text-sm font-semibold text-brand mb-4">{email}</p>
      <p className="text-xs text-gray-400 mb-6">
        Click the link in the email to verify your account and activate your organization.
      </p>
      <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-xl mb-5 text-left">
        <p className="text-xs text-yellow-700">
          <strong>📌 Tip:</strong> Check your spam/junk folder if you don't see it within a minute.
        </p>
      </div>
      <button
        onClick={resend}
        disabled={resending}
        className="w-full py-2.5 rounded-xl border-2 border-brand text-brand font-semibold text-sm hover:bg-purple-50 transition-colors disabled:opacity-50">
        {resending ? 'Resending...' : '🔄 Resend verification email'}
      </button>
      <p className="text-center text-sm text-gray-500 mt-4">
        <Link to="/login" className="text-brand font-medium">Back to login</Link>
      </p>
    </div>
  );
}

// Main Signup Page — controls the step
export default function Signup() {
  const [step, setStep] = useState('form'); // 'form' | 'check-email'
  const [email, setEmail] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
      <div className="card p-8 w-full max-w-sm">
        {step === 'form' && (
          <SignupForm onSuccess={(e) => { setEmail(e); setStep('check-email'); }} />
        )}
        {step === 'check-email' && (
          <CheckEmail email={email} />
        )}
      </div>
    </div>
  );
}
