import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import superAdminApi from '../../lib/superAdminApi';
import { useSuperAdminStore } from '../../store/superAdminStore';

const PLANS = ['free', 'pro', 'enterprise'];

const StatCard = ({ label, value, color }) => (
  <div className={`bg-gradient-to-br ${color} rounded-2xl p-4`}>
    <p className="text-white/70 text-xs font-medium">{label}</p>
    <p className="text-white text-3xl font-black mt-1">{value}</p>
  </div>
);

// Mini stat pill inside org row
const Pill = ({ label, value, color = 'bg-gray-800 text-gray-300' }) => (
  <div className={`flex flex-col items-center rounded-xl px-3 py-1.5 ${color} min-w-[56px]`}>
    <span className="text-[10px] font-medium opacity-70 whitespace-nowrap">{label}</span>
    <span className="text-sm font-black">{value}</span>
  </div>
);

export default function SuperAdminDashboard() {
  const { admin, logout } = useSuperAdminStore();
  const navigate = useNavigate();
  const [orgs, setOrgs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('all');
  const [expanded, setExpanded]   = useState(null); // org _id that is expanded

  const fetchOrgs = () => {
    setLoading(true);
    superAdminApi.get('/superadmin/organizations')
      .then(r => setOrgs(r.data))
      .catch(() => toast.error('Failed to load organizations'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrgs(); }, []);

  const handleLogout = () => { logout(); navigate('/superadmin/login'); };

  const toggleVerified = async (org) => {
    try {
      await superAdminApi.patch(`/superadmin/organizations/${org._id}`, { isVerified: !org.isVerified });
      toast.success(`Organization ${!org.isVerified ? 'verified' : 'unverified'}`);
      fetchOrgs();
    } catch { toast.error('Failed to update'); }
  };

  const updatePlan = async (org, plan) => {
    try {
      await superAdminApi.patch(`/superadmin/organizations/${org._id}`, { plan });
      toast.success(`Plan updated to ${plan}`);
      fetchOrgs();
    } catch { toast.error('Failed to update plan'); }
  };

  const filtered = orgs.filter(org => {
    const matchSearch = !search ||
      org.name?.toLowerCase().includes(search.toLowerCase()) ||
      org.email?.toLowerCase().includes(search.toLowerCase()) ||
      org.slug?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all'        ? true :
      filter === 'verified'   ? org.isVerified :
      !org.isVerified;
    return matchSearch && matchFilter;
  });

  // Global stats across all orgs
  const g = {
    total:          orgs.length,
    verified:       orgs.filter(o => o.isVerified).length,
    unverified:     orgs.filter(o => !o.isVerified).length,
    pro:            orgs.filter(o => o.plan === 'pro' || o.plan === 'enterprise').length,
    gamesPlayed:    orgs.reduce((a, o) => a + (o.stats?.gamesPlayed    ?? 0), 0),
    gamesWon:       orgs.reduce((a, o) => a + (o.stats?.gamesWon       ?? 0), 0),
    offersRedeemed: orgs.reduce((a, o) => a + (o.stats?.offersRedeemed ?? 0), 0),
    customers:      orgs.reduce((a, o) => a + (o.stats?.customers      ?? 0), 0),
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Topbar */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm">R</div>
          <div>
            <h1 className="font-bold text-white text-sm">RewardBytes</h1>
            <p className="text-gray-500 text-xs">Super Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm hidden sm:block">{admin?.email}</span>
          <button onClick={handleLogout} className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">Logout</button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">

        {/* Global stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Orgs"       value={g.total}          color="from-purple-600 to-indigo-600" />
          <StatCard label="Total Customers"  value={g.customers}      color="from-pink-600 to-rose-600" />
          <StatCard label="Games Played"     value={g.gamesPlayed}    color="from-blue-600 to-cyan-600" />
          <StatCard label="Offers Redeemed"  value={g.offersRedeemed} color="from-green-600 to-emerald-600" />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
            <input
              type="text" placeholder="Search by name, email or slug..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs">✕</button>}
          </div>
          <div className="flex gap-2">
            {[['all','All'],['verified','✅ Verified'],['unverified','⏳ Unverified']].map(([val,label]) => (
              <button key={val} onClick={() => setFilter(val)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  filter === val ? 'bg-purple-600 border-purple-600 text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-purple-500 hover:text-white'
                }`}>{label}</button>
            ))}
          </div>
        </div>

        {/* Org Cards */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="font-bold text-white">Organizations <span className="ml-1 text-xs font-normal text-gray-400">({filtered.length})</span></h2>
            <button onClick={fetchOrgs} className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300">🔄 Refresh</button>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-500">⏳ Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-3xl mb-2">🏢</p>
              <p>{search ? `No results for "${search}"` : 'No organizations found'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filtered.map(org => {
                const s = org.stats || {};
                const isOpen = expanded === org._id;
                return (
                  <div key={org._id}>
                    {/* Main row */}
                    <div
                      className="px-5 py-4 hover:bg-gray-800/40 transition-colors cursor-pointer"
                      onClick={() => setExpanded(isOpen ? null : org._id)}
                    >
                      <div className="flex items-center justify-between gap-4">
                        {/* Left: org info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-700 to-indigo-700 flex items-center justify-center text-white font-black text-sm shrink-0">
                            {org.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white text-sm truncate">{org.name}</p>
                            <p className="text-xs text-gray-500 truncate">{org.email} · {org.slug}</p>
                          </div>
                        </div>

                        {/* Right: badges + actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Plan */}
                          <select
                            value={org.plan || 'free'}
                            onClick={e => e.stopPropagation()}
                            onChange={e => { e.stopPropagation(); updatePlan(org, e.target.value); }}
                            className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${
                              org.plan === 'enterprise' ? 'bg-purple-900 text-purple-300' :
                              org.plan === 'pro'        ? 'bg-blue-900 text-blue-300' :
                              'bg-gray-800 text-gray-400'
                            }`}>
                            {PLANS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                          </select>

                          {/* Status */}
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            org.isVerified ? 'bg-green-900/60 text-green-400' : 'bg-yellow-900/60 text-yellow-400'
                          }`}>
                            {org.isVerified ? '✅ Verified' : '⏳ Pending'}
                          </span>

                          {/* Verify toggle */}
                          <button
                            onClick={e => { e.stopPropagation(); toggleVerified(org); }}
                            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors hidden sm:block ${
                              org.isVerified ? 'bg-red-900/50 hover:bg-red-900 text-red-400' : 'bg-green-900/50 hover:bg-green-900 text-green-400'
                            }`}>
                            {org.isVerified ? 'Revoke' : 'Verify'}
                          </button>

                          {/* Expand chevron */}
                          <span className="text-gray-500 text-xs">{isOpen ? '▲' : '▼'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded stats row */}
                    {isOpen && (
                      <div className="px-5 pb-5 bg-gray-800/30">
                        <div className="flex flex-wrap gap-2 pt-3">
                          <Pill label="Customers"       value={s.customers      ?? 0} color="bg-pink-900/60 text-pink-300" />
                          <Pill label="Games Played"    value={s.gamesPlayed    ?? 0} color="bg-blue-900/60 text-blue-300" />
                          <Pill label="Games Won"       value={s.gamesWon       ?? 0} color="bg-green-900/60 text-green-300" />
                          <Pill label="Games Lost"      value={s.gamesLost      ?? 0} color="bg-red-900/60 text-red-300" />
                          <Pill label="Games Enabled"   value={s.gamesEnabled   ?? 0} color="bg-indigo-900/60 text-indigo-300" />
                          <Pill label="Offers Created"  value={s.offersCreated  ?? 0} color="bg-yellow-900/60 text-yellow-300" />
                          <Pill label="Offers Redeemed" value={s.offersRedeemed ?? 0} color="bg-emerald-900/60 text-emerald-300" />
                          <Pill label="Staff Users"     value={s.users          ?? 0} color="bg-purple-900/60 text-purple-300" />
                        </div>
                        <p className="text-xs text-gray-600 mt-3">
                          Joined {new Date(org.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
