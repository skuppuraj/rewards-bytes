import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import publicApi from '../../lib/publicApi';
import { useCustomerStore } from '../../store/customerStore';

export default function PortalLogin() {
  const { orgSlug }       = useParams();
  const navigate          = useNavigate();
  const location          = useLocation();
  const { setCustomerAuth } = useCustomerStore();

  // Where to go after login — default to game list
  const returnTo = location.state?.returnTo || `/play/${orgSlug}`;

  const [step, setStep]     = useState('phone'); // phone | otp | name
  const [phone, setPhone]   = useState('');
  const [otp, setOtp]       = useState('');
  const [name, setName]     = useState('');
  const [isNew, setIsNew]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [orgId, setOrgId]   = useState(null);

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) { toast.error('Enter a valid phone number'); return; }
    setLoading(true);
    try {
      // Get orgId from context
      const orgRes = await publicApi.get(`/org/${orgSlug}`);
      setOrgId(orgRes.data.org.id);
      await publicApi.post('/otp/send', { phone });
      toast.success('OTP sent!');
      setStep('otp');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to send OTP'); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) { toast.error('Enter the OTP'); return; }
    setLoading(true);
    try {
      const res = await publicApi.post('/otp/verify', { phone, otp, orgId });
      if (res.data.customer.name === phone) {
        // New customer — ask for name
        setIsNew(true);
        setStep('name');
        setLoading(false);
        return;
      }
      setCustomerAuth(res.data.token, res.data.customer, null, null);
      toast.success(`Welcome back, ${res.data.customer.name}!`);
      navigate(returnTo, { replace: true });
    } catch (err) { toast.error(err.response?.data?.error || 'Invalid OTP'); }
    finally { setLoading(false); }
  };

  const handleSetName = async () => {
    if (!name.trim()) { toast.error('Please enter your name'); return; }
    setLoading(true);
    try {
      const res = await publicApi.post('/otp/verify', { phone, otp, orgId, name: name.trim() });
      setCustomerAuth(res.data.token, res.data.customer, null, null);
      toast.success(`Welcome, ${res.data.customer.name}!`);
      navigate(returnTo, { replace: true });
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl p-6">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔑</div>
          <h2 className="text-xl font-bold text-gray-900">Login to Play</h2>
          <p className="text-sm text-gray-500 mt-1">Enter your phone number to continue</p>
        </div>

        {step === 'phone' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                placeholder="Enter your phone number"
                value={phone} onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                type="tel" maxLength={15}
              />
            </div>
            <button onClick={handleSendOtp} disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold text-sm"
              style={{ background: 'var(--brand-btn, #6366f1)' }}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 text-center">OTP sent to <strong>{phone}</strong></p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-center tracking-widest text-lg font-bold focus:outline-none focus:ring-2 focus:ring-purple-200"
                placeholder="- - - -"
                value={otp} onChange={e => setOtp(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                type="number" maxLength={6}
              />
            </div>
            <button onClick={handleVerifyOtp} disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold text-sm"
              style={{ background: 'var(--brand-btn, #6366f1)' }}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button onClick={() => setStep('phone')} className="w-full text-sm text-gray-400 hover:text-gray-600">
              ← Change number
            </button>
          </div>
        )}

        {step === 'name' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 text-center">Welcome! What’s your name?</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                placeholder="Enter your name"
                value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSetName()}
                autoFocus
              />
            </div>
            <button onClick={handleSetName} disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold text-sm"
              style={{ background: 'var(--brand-btn, #6366f1)' }}>
              {loading ? 'Saving...' : "Let's Play! 🎮"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
