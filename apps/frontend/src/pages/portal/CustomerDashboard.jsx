import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import publicApi from '../../lib/publicApi';
import { useCustomerStore } from '../../store/customerStore';
import { format } from 'date-fns';

export default function CustomerDashboard() {
  const { orgSlug } = useParams();
  const { customer, logout } = useCustomerStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState('offers');
  const [games, setGames] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      publicApi.get('/my/games'),
      publicApi.get('/my/offers')
    ]).then(([g, o]) => {
      setGames(g.data); setOffers(o.data);
    }).finally(() => setLoading(false));
  }, []);

  const statusBadge = (status) => {
    const map = { active: 'badge-active', redeemed: 'badge-redeemed', expired: 'badge-expired', completed: 'badge-active', abandoned: 'badge-expired' };
    return <span className={map[status] || 'bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full'}>{status}</span>;
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* Profile */}
      <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-purple-600">{customer?.name?.[0]}</div>
          <div>
            <p className="text-white font-semibold">{customer?.name}</p>
            <p className="text-white/60 text-xs">{customer?.phone}</p>
          </div>
        </div>
        <button onClick={() => { logout(); navigate(`/play/${orgSlug}`); }} className="text-xs text-white/60 hover:text-white">🚪 Logout</button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white/10 rounded-xl p-1 mb-4">
        {['offers', 'games'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${ tab === t ? 'bg-white text-gray-900' : 'text-white/70 hover:text-white' }`}>
            {t === 'offers' ? '🎁 My Offers' : '🎮 My Games'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-white/70 py-8">⏳ Loading...</div>
      ) : tab === 'offers' ? (
        <div className="space-y-3">
          {offers.length === 0 && <div className="text-center bg-white/10 rounded-xl p-6 text-white/60 text-sm">No offers yet. Play a game to win!</div>}
          {offers.map(c => (
            <div key={c._id} className="bg-white rounded-xl p-4 shadow">
              <div className="flex items-start gap-3">
                {c.offerId?.imageUrl && <img src={c.offerId.imageUrl} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" alt="" />}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900 text-sm">{c.offerId?.name}</p>
                    {statusBadge(c.status)}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{c.offerId?.shortDescription}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="font-mono font-bold text-brand text-sm">{c.code}</p>
                    <p className="text-xs text-gray-400">
                      {c.status === 'redeemed' ? '✅ Redeemed' : c.expiresAt ? `Expires ${format(new Date(c.expiresAt), 'dd MMM')}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {games.length === 0 && <div className="text-center bg-white/10 rounded-xl p-6 text-white/60 text-sm">No games played yet!</div>}
          {games.map(s => (
            <div key={s._id} className="bg-white rounded-xl p-4 shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{s.gameId?.key === 'spin_wheel' ? '🎡' : '🃏'}</span>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{s.gameId?.name}</p>
                    <p className="text-xs text-gray-400">{s.startedAt ? format(new Date(s.startedAt), 'dd MMM yyyy, HH:mm') : ''}</p>
                  </div>
                </div>
                {statusBadge(s.status)}
              </div>
              {s.offerId && (
                <div className="mt-2 p-2 bg-purple-50 rounded-lg text-xs">
                  <span className="text-purple-600 font-medium">🎁 {s.offerId.name}</span>
                  {s.couponId && <span className="ml-2 font-mono text-brand">{s.couponId.code}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button onClick={() => navigate(`/play/${orgSlug}`)} className="mt-4 w-full py-3 rounded-xl bg-white/20 text-white font-medium text-sm">🎮 Play More Games</button>
    </div>
  );
}
