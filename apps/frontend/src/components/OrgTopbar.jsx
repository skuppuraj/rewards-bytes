import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

export default function OrgTopbar() {
  const { org } = useAuthStore();
  const [sub, setSub]       = useState(null);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/subscriptions/active')
      .then(r => setSub(r.data))
      .catch(() => setSub(null))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  const isActive  = sub?.status === 'active';
  const isTrial   = isActive && sub?.isTrial;
  const expiresAt = sub?.expiresAt ? new Date(sub.expiresAt) : null;
  const daysLeft  = expiresAt ? Math.ceil((expiresAt - Date.now()) / 86400000) : null;
  const planName  = sub?.planId?.name || null;

  const isExpired = !isActive;
  const isWarning = isActive && daysLeft !== null && daysLeft <= 7 && daysLeft > 0;

  const barBg =
    isExpired ? 'bg-red-50 border-red-200' :
    isWarning ? 'bg-yellow-50 border-yellow-200' :
    isTrial   ? 'bg-blue-50 border-blue-100' :
    'bg-white border-gray-100';

  const badgeCls =
    isExpired ? 'bg-red-100 text-red-600' :
    isWarning ? 'bg-yellow-100 text-yellow-700' :
    isTrial   ? 'bg-blue-100 text-blue-700' :
    'bg-purple-100 text-purple-700';

  return (
    <div className={`flex items-center justify-between px-5 py-2 border-b text-xs flex-shrink-0 ${barBg}`}>
      {/* Left: org name + plan badge */}
      <div className="flex items-center gap-2.5">
        <span className="font-semibold text-gray-700">{org?.name}</span>
        <span className="text-gray-300">|</span>

        {isExpired ? (
          <span className="font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
            No Active Plan
          </span>
        ) : (
          <span className={`font-bold px-2 py-0.5 rounded-full ${badgeCls}`}>
            {isTrial ? `🧪 Trial — ${planName}` : `✅ ${planName}`}
          </span>
        )}
      </div>

      {/* Right: expiry info + action */}
      <div className="flex items-center gap-3">
        {isActive && expiresAt && (
          <span className={`${
            isWarning ? 'text-yellow-700 font-semibold' : 'text-gray-400'
          }`}>
            {daysLeft > 0
              ? `Expires ${expiresAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · ${daysLeft}d left`
              : '❌ Expired today'}
          </span>
        )}

        {isExpired && (
          <span className="text-red-600 font-semibold">❌ Subscription expired</span>
        )}

        {/* Show upgrade button on: trial, warning (≤7d), or expired */}
        {(isTrial || isWarning || isExpired) && (
          <button
            onClick={() => navigate('/account')}
            className={`px-3 py-1 rounded-lg text-white font-semibold transition-colors ${
              isExpired ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'
            }`}>
            {isExpired ? '🛒 Buy Plan' : isTrial ? '⬆️ Upgrade' : '🔄 Renew'}
          </button>
        )}
      </div>
    </div>
  );
}
