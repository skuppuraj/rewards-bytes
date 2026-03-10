import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/api';

// Routes allowed even when plan is expired
const ALLOWED_ROUTES = ['/account', '/login', '/signup', '/verify-email', '/coupons'];

export default function PlanExpiredGuard({ children }) {
  const [status, setStatus] = useState('loading'); // loading | active | expired | none
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => {
    api.get('/subscriptions/active')
      .then(r => setStatus(r.data?.status === 'active' ? 'active' : 'none'))
      .catch(() => setStatus('none'));
  }, [location.pathname]);

  const isAllowed = ALLOWED_ROUTES.some(r => location.pathname.startsWith(r));

  if (status === 'loading') return null;

  if (status !== 'active' && !isAllowed) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white border-2 border-red-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Plan Expired or Not Active</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your subscription has expired or no active plan is found.
            Please purchase a plan to continue using RewardBytes.
          </p>
          <button onClick={() => navigate('/account')}
            className="btn-primary w-full py-3">
            💳 View Plans & Subscribe
          </button>
        </div>
      </div>
    );
  }

  return children;
}
