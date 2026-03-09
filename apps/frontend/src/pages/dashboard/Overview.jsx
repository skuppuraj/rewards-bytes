import { useEffect, useState } from 'react';
import { Users, Gamepad2, Ticket, Trophy, TrendingUp } from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import PageHeader from '@/components/layout/PageHeader';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

export default function Overview() {
  const { org } = useAuthStore();
  const [stats, setStats] = useState({ players: 0, games: 0, coupons: 0, pointsAwarded: 0 });
  const [topPlayers, setTopPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playersRes, gamesRes, couponsRes] = await Promise.all([
          api.get('/players'), api.get('/games'), api.get('/coupons')
        ]);
        const players = playersRes.data;
        setStats({ players: players.length, games: gamesRes.data.length, coupons: couponsRes.data.length, pointsAwarded: players.reduce((sum, p) => sum + p.totalPoints, 0) });
        setTopPlayers(players.slice(0, 5));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  return (
    <div className="p-6 lg:p-8">
      <PageHeader title="Welcome back 👋" subtitle={`Here's what's happening at ${org?.name} today`} />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Players" value={stats.players} icon={Users} color="indigo" trend={12} loading={loading} />
        <StatCard title="Active Games" value={stats.games} icon={Gamepad2} color="purple" trend={5} loading={loading} />
        <StatCard title="Coupons" value={stats.coupons} icon={Ticket} color="orange" loading={loading} />
        <StatCard title="Points Awarded" value={stats.pointsAwarded.toLocaleString()} icon={Trophy} color="green" trend={8} loading={loading} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">🏆 Top Players</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? [...Array(5)].map((_, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-32" />
                  <div className="h-2.5 bg-gray-100 rounded animate-pulse w-20" />
                </div>
              </div>
            )) : topPlayers.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">No players yet</div>
            ) : topPlayers.map((player, idx) => (
              <div key={player._id} className="px-5 py-3 flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-500'
                }`}>{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{player.name}</p>
                  <p className="text-xs text-gray-400">Level {player.level}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-sm font-semibold text-indigo-700">{player.totalPoints.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">⚡ Quick Actions</h2>
          </div>
          <div className="p-5 grid grid-cols-2 gap-3">
            {[
              { label: 'Add Player', icon: Users, to: '/dashboard/players' },
              { label: 'Create Game', icon: Gamepad2, to: '/dashboard/games' },
              { label: 'New Coupon', icon: Ticket, to: '/dashboard/coupons' },
              { label: 'View Reports', icon: TrendingUp, to: '#' },
            ].map(({ label, icon: Icon, to }) => (
              <a key={label} href={to} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="text-xs font-medium text-gray-700 group-hover:text-indigo-700">{label}</span>
              </a>
            ))}
          </div>
          <div className="px-5 pb-5">
            <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{org?.name}</p>
                  <p className="text-xs text-indigo-600 font-medium capitalize">{org?.plan} Plan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
