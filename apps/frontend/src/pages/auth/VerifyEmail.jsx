import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../lib/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [orgName, setOrgName] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing.');
      return;
    }
    api.get(`/auth/verify-email?token=${token}`)
      .then(r => {
        setOrgName(r.data.orgName || '');
        setStatus('success');
      })
      .catch(err => {
        setMessage(err.response?.data?.error || 'Verification failed.');
        setStatus('error');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
      <div className="card p-8 w-full max-w-sm text-center">
        <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-5">R</div>

        {status === 'loading' && (
          <>
            <div className="text-4xl mb-3 animate-pulse">⏳</div>
            <h2 className="text-lg font-bold text-gray-800">Verifying your email...</h2>
            <p className="text-sm text-gray-400 mt-1">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Email Verified!</h2>
            {orgName && <p className="text-sm text-gray-500 mb-1">Welcome, <strong>{orgName}</strong>!</p>}
            <p className="text-sm text-gray-500 mb-6">Your account is now active. You can log in to your dashboard.</p>
            <Link to="/login" className="btn-primary w-full py-2.5 block text-center">
              🚀 Go to Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">❌</div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Verification Failed</h2>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <Link to="/signup" className="btn-primary w-full py-2.5 block text-center mb-2">
              Try signing up again
            </Link>
            <Link to="/login" className="text-sm text-brand font-medium">Back to login</Link>
          </>
        )}
      </div>
    </div>
  );
}
