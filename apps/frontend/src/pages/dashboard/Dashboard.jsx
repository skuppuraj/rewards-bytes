import React, { useEffect, useState } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import api from '../../lib/api';
import StatCard from '../../components/StatCard';
import PageHeader from '../../components/PageHeader';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [gamesChart, setGamesChart] = useState([]);
  const [couponChart, setCouponChart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, g, c] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/chart/games-per-day'),
          api.get('/dashboard/chart/coupon-status')
        ]);
        setStats(s.data); setGamesChart(g.data); setCouponChart(c.data);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const lineData = {
    labels: gamesChart.map(d => d.date),
    datasets: [{ label: 'Games Played', data: gamesChart.map(d => d.games), fill: true,
      backgroundColor: 'rgba(99,102,241,0.08)', borderColor: '#6366f1', borderWidth: 2,
      pointBackgroundColor: '#6366f1', tension: 0.4 }]
  };

  const pieData = {
    labels: couponChart.map(d => d.label),
    datasets: [{ data: couponChart.map(d => d.value), backgroundColor: ['#6366f1','#10b981','#ef4444'], borderWidth: 0 }]
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin text-3xl">⏳</div></div>;

  return (
    <div className="p-6">
      <PageHeader title="Dashboard" subtitle="Your business at a glance" />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard title="Games Today" value={stats?.gamesToday ?? 0} icon="🎮" color="purple" />
        <StatCard title="Offers Redeemed" value={stats?.offersRedeemed ?? 0} icon="✅" color="green" />
        <StatCard title="Total Customers" value={stats?.totalCustomers ?? 0} icon="👥" color="blue" />
        <StatCard title="Total Coupons" value={stats?.totalCoupons ?? 0} icon="🎟️" color="orange" />
        <StatCard title="Conversion Rate" value={`${stats?.conversionRate ?? 0}%`} icon="📈" color="pink" sub="redeemed / total" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Games Played — Last 7 Days</h3>
          <Line data={lineData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#f3f4f6' } }, x: { grid: { display: false } } } }} />
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Coupon Status</h3>
          {couponChart.some(d => d.value > 0)
            ? <Pie data={pieData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
            : <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No coupon data yet</div>
          }
        </div>
      </div>
    </div>
  );
}
