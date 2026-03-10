import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

export default function OrgTopbar() {
  const { org } = useAuthStore();
  const [sub, setSub]   = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/subscriptions/active')
      .then(r => setSub(r.data))
      .catch(() => {});
  }, []);

  const expiresAt = sub?.expiresAt ? new Date(sub.expiresAt) : null;
  const daysLeft  = expiresAt ? Math.ceil((expiresAt - Date.now()) / 86400000) : null;
  const planName  = sub?.planId?.name || 'No Plan';
  const isExpired = !sub || daysLeft <= 0;
  const isWarning = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;

  return (
    <div className={`flex items-center justify-between px-5 py-2.5 border-b text-xs ${
      isExpired  ? 'bg-red-50 border-red-200' :
      isWarning  ? 'bg-yellow-50 border-yellow-200' :
      'bg-white border-gray-100'
    }`}>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-gray-700">{org?.name}</span>
        <span className="text-gray-300">|</span>
        <span className={`font-bold px-2 py-0.5 rounded-full ${
          isExpired ? 'bg-red-100 text-red-600' :
          isWarning ? 'bg-yellow-100 text-yellow-700' :
          'bg-purple-100 text-purple-700'
        }`}>
          {planName}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {expiresAt && (
          <span className={isExpired ? 'text-red-600 font-semibold' : isWarning ? 'text-yellow-700' : 'text-gray-400'}>
            {isExpired ? '❌ Expired' : `Expires ${expiresAt.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })} • ${daysLeft}d left`}
          </span>
        )}
        {(isExpired || isWarning) && (
          <button onClick={() => navigate('/account')}
            className="px-3 py-1 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors">
            Upgrade
          </button>
        )}
      </div>
    </div>
  );
}
