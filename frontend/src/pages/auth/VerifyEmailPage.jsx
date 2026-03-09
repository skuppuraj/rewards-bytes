import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Gamepad2, Loader2, MailCheck } from 'lucide-react';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, email, organization_name } = location.state || {};
  const { setAuth } = useAuthStore();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputs = useRef([]);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[i] = val;
    setOtp(newOtp);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handleSubmit = async () => {
    const code = otp.join('');
    if (code.length < 6) return setError('Enter all 6 digits');
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/verify-email', { userId, otp: code, organization_name });
      setAuth(res.user, res.token, res.organization);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-100 rounded-2xl mb-4">
            <MailCheck className="w-7 h-7 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
          <p className="text-gray-500 mt-2 text-sm">We sent a 6-digit code to <span className="font-medium text-gray-900">{email}</span></p>
          {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
          <div className="flex gap-3 justify-center mt-6">
            {otp.map((digit, i) => (
              <input
                key={i} ref={el => inputs.current[i] = el}
                value={digit} onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                maxLength={1} inputMode="numeric"
                className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            ))}
          </div>
          <button onClick={handleSubmit} disabled={loading} className="mt-6 w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Verify Email
          </button>
          <p className="mt-4 text-sm text-gray-500">Didn't receive it? Check your spam folder.</p>
        </div>
      </div>
    </div>
  );
}
