import React, { useEffect, useState } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import publicApi from '../../lib/publicApi';
import { useCustomerStore } from '../../store/customerStore';

export const OrgContext = React.createContext(null);

export default function GamePortal() {
  const { orgSlug } = useParams();
  const [orgData, setOrgData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { settings, setCustomerAuth, customer, org } = useCustomerStore();

  useEffect(() => {
    publicApi.get(`/org/${orgSlug}`).then(r => {
      setOrgData(r.data);
      const s = r.data.settings;
      if (s) {
        document.documentElement.style.setProperty('--brand-btn', s.primaryButtonColor || '#6366f1');
        document.documentElement.style.setProperty('--brand-btn2', s.secondaryButtonColor || '#8b5cf6');
        document.documentElement.style.setProperty('--brand-text', s.primaryTextColor || '#111827');
        document.documentElement.style.setProperty('--brand-text2', s.secondaryTextColor || '#6b7280');
        if (s.fontStyle) document.body.style.fontFamily = `'${s.fontStyle}', sans-serif`;
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [orgSlug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl animate-spin inline-block mb-3">⏳</div>
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );

  if (!orgData) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-2xl mb-2">🚫</p>
        <p className="text-gray-600">Organization not found</p>
      </div>
    </div>
  );

  const bgStyle = orgData.settings?.backgroundImageUrl
    ? { backgroundImage: `url(${orgData.settings.backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };

  return (
    <OrgContext.Provider value={orgData}>
      <div className="min-h-screen" style={bgStyle}>
        <div className="min-h-screen bg-black/20">
          <header className="bg-white/10 backdrop-blur-sm border-b border-white/20 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {orgData.settings?.logoUrl
                ? <img src={orgData.settings.logoUrl} alt={orgData.org.name} className="h-8 w-auto" />
                : <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-purple-600">{orgData.org.name[0]}</div>
              }
              <span className="text-white font-semibold text-sm">{orgData.org.name}</span>
            </div>
          </header>
          <Outlet />
        </div>
      </div>
    </OrgContext.Provider>
  );
}
