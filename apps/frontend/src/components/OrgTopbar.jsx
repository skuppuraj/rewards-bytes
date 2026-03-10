import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

export default function OrgTopbar({ onMenuClick }) {
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
    <div className={`flex items-center justify-between px-4 py-2 border-b text-xs flex-shrink-0 ${barBg}`}>
      {/* Left: hamburger (mobile) + org name + plan badge */}
      <div className="flex items-center gap-2.5">
        {/* Hamburger — visible only on mobile */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 flex flex-col gap-1"
          aria-label="Open menu"
        >
          <span className="block w-5 h-0.5 bg-gray-600 rounded" />
          <span className="block w-5 h-0.5 bg-gray-600 rounded" />
          <span className="block w-5 h-0.5 bg-gray-600 rounded" />
        </button>

        <span className="font-semibold text-gray-700">{org?.name}</span>
        <span className="text-gray-300 hidden sm:inline">|</span>

        {isExpired ? (
          <span className="font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 hidden sm:inline">
            No Active Plan
          </span>
        ) : (
          <span className={`font-bold px-2 py-0.5 rounded-full ${badgeCls} hidden sm:inline`}>
            {isTrial ? `🧪 Trial — ${planName}` : `✅ ${planName}`}
          </span>
        )}
      </div>

      {/* Right: expiry info + action */}
      <div className="flex items-center gap-3">
        {isActive && expiresAt && (
          <span className={`hidden sm:inline ${
            isWarning ? 'text-yellow-700 font-semibold' : 'text-gray-400'
          }`}>
            {daysLeft > 0
              ? `Expires ${expiresAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · ${daysLeft}d left`
              : '❌ Expired today'}
          </span>
        )}

        {isExpired && (
          <span className="text-red-600 font-semibold hidden sm:inline">❌ Subscription expired</span>
        )}

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
