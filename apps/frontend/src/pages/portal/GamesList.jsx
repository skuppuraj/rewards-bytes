import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import publicApi from '../../lib/publicApi';
import { useCustomerStore } from '../../store/customerStore';
import { OrgContext } from './GamePortal';

export default function GamesList() {
  const { orgSlug } = useParams();
  const orgData = useContext(OrgContext);
  const { token, customer } = useCustomerStore();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orgData?.org?.id) {
      publicApi.get(`/games/${orgData.org.id}`).then(r => setGames(r.data)).finally(() => setLoading(false));
    }
  }, [orgData]);

  const gameIcon = (key) => key === 'spin_wheel' ? '🎡' : key === 'scratch_card' ? '🃏' : '❓';

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* Welcome Banner */}
      <div className="text-center mb-6">
        {customer
          ? <div>
              <p className="text-white text-lg font-bold">Hey {customer.name}! 👋</p>
              <p className="text-white/70 text-sm mt-1">Ready to win amazing rewards?</p>
            </div>
          : <div>
              <p className="text-white text-xl font-bold">Play & Win! 🎉</p>
              <p className="text-white/70 text-sm mt-1">Login to start playing and win exciting offers</p>
            </div>
        }
      </div>

      {/* Action Buttons */}
      {!token
        ? <div className="flex gap-2 mb-6">
            <Link to={`/play/${orgSlug}/login`} className="flex-1 text-center py-3 rounded-xl font-semibold text-white text-sm" style={{background: 'var(--brand-btn, #6366f1)'}}>Login to Play</Link>
          </div>
        : <div className="flex gap-2 mb-6">
            <Link to={`/play/${orgSlug}/dashboard`} className="flex-1 text-center py-2.5 rounded-xl font-medium text-sm bg-white/20 text-white hover:bg-white/30 transition-colors">📊 My Rewards</Link>
          </div>
      }

      {/* Games */}
      {loading ? (
        <div className="text-center text-white/70 py-8">⏳ Loading games...</div>
      ) : games.length === 0 ? (
        <div className="text-center bg-white/10 rounded-2xl p-8">
          <p className="text-white text-4xl mb-2">🎮</p>
          <p className="text-white font-semibold">No games available yet</p>
          <p className="text-white/60 text-sm mt-1">Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {games.map(orgGame => (
            <div key={orgGame._id} className="bg-white rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center text-3xl flex-shrink-0">
                  {orgGame.gameId?.imageUrl ? <img src={orgGame.gameId.imageUrl} className="w-full h-full object-cover rounded-xl" alt="" /> : gameIcon(orgGame.gameId?.key)}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{orgGame.gameId?.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{orgGame.gameId?.shortDescription}</p>
                  {orgGame.timerMinutes > 0 && <p className="text-xs text-orange-500 mt-0.5">⏱ {orgGame.timerMinutes} min timer</p>}
                </div>
                <button
                  onClick={() => token ? navigate(`/play/${orgSlug}/start/${orgGame._id}`) : navigate(`/play/${orgSlug}/login`)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex-shrink-0" style={{background: 'var(--brand-btn, #6366f1)'}}>
                  {token ? 'Play' : 'Login'}
                </button>
              </div>
              {orgGame.assignedOffers?.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {orgGame.assignedOffers.slice(0, 3).map(o => (
                    <span key={o._id} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                      {o.discountType === 'percentage' ? `${o.discountValue}% off` : `₹${o.discountValue} off`}
                    </span>
                  ))}
                  {orgGame.assignedOffers.length > 3 && <span className="text-xs text-gray-400">+{orgGame.assignedOffers.length - 3} more</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
