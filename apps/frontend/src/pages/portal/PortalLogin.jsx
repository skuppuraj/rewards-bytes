import React, { useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import publicApi from '../../lib/publicApi';
import { useCustomerStore } from '../../store/customerStore';
import { OrgContext } from './GamePortal';

export default function PortalLogin() {
  const { orgSlug } = useParams();
  const orgData = useContext(OrgContext);
  const { setCustomerAuth } = useCustomerStore();
  const navigate = useNavigate();

  const [step, setStep] = useState('form'); // form | otp
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) return toast.error('Enter a valid phone number');
    setLoading(true);
    try {
      await publicApi.post('/otp/send', { phone: `91${phone}` });
      toast.success('OTP sent to your WhatsApp!');
      setStep('otp');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await publicApi.post('/otp/verify', {
        phone: `91${phone}`, otp, name,
        orgId: orgData.org.id,
        marketingConsent: consent
      });
      setCustomerAuth(data.token, data.customer, orgData.org, orgData.settings);
      toast.success(`Welcome, ${data.customer.name}! 🎉`);
      navigate(`/play/${orgSlug}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-60px)] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🎮</div>
          <h2 className="text-xl font-bold text-gray-900">Join & Play!</h2>
          <p className="text-sm text-gray-500 mt-1">Verify via WhatsApp to start winning</p>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="label">Your Name</label>
              <input className="input" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="label">WhatsApp Number</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-gray-200 rounded-l-lg bg-gray-50 text-sm text-gray-500">🇮🇳 +91</span>
                <input className="input rounded-l-none" type="tel" placeholder="9876543210" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} required />
              </div>
            </div>
            {orgData?.settings?.marketingConsentEnabled && (
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-0.5" checked={consent} onChange={e => setConsent(e.target.checked)} />
                <span className="text-xs text-gray-500">I agree to receive promotional offers and updates from {orgData.org.name} via WhatsApp.</span>
              </label>
            )}
            <button className="w-full py-3 rounded-xl font-semibold text-white text-sm" style={{background: 'var(--brand-btn, #6366f1)'}} disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP on WhatsApp 💬'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <p className="text-sm text-green-700">💬 OTP sent to <strong>+91 {phone}</strong></p>
            </div>
            <div>
              <label className="label">Enter OTP</label>
              <input className="input text-center text-2xl font-mono tracking-widest" placeholder="• • • • • •" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} required />
            </div>
            <button className="w-full py-3 rounded-xl font-semibold text-white text-sm" style={{background: 'var(--brand-btn, #6366f1)'}} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Continue →'}
            </button>
            <button type="button" onClick={() => setStep('form')} className="w-full text-sm text-gray-500 hover:text-gray-700">← Change number</button>
          </form>
        )}
      </div>
    </div>
  );
}
