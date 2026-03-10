import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import superAdminApi from '../../lib/superAdminApi';
import { useSuperAdminStore } from '../../store/superAdminStore';

const PLAN_COLORS = {
  free:       'bg-gray-100 text-gray-600',
  pro:        'bg-blue-100 text-blue-700',
  enterprise: 'bg-purple-100 text-purple-700',
};

const PLANS = ['free', 'pro', 'enterprise'];

export default function SuperAdminDashboard() {
  const { admin, logout } = useSuperAdminStore();
  const navigate = useNavigate();
  const [orgs, setOrgs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all'); // all | verified | unverified

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
      filter === 'all' ? true :
      filter === 'verified' ? org.isVerified :
      !org.isVerified;
    return matchSearch && matchFilter;
  });

  const stats = {
    total:      orgs.length,
    verified:   orgs.filter(o => o.isVerified).length,
    unverified: orgs.filter(o => !o.isVerified).length,
    pro:        orgs.filter(o => o.plan === 'pro').length,
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
          <span className="text-gray-400 text-sm">{admin?.email}</span>
          <button onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
            Logout
          </button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Orgs',   value: stats.total,      color: 'from-purple-600 to-indigo-600' },
            { label: 'Verified',     value: stats.verified,   color: 'from-green-600 to-emerald-600' },
            { label: 'Unverified',   value: stats.unverified, color: 'from-yellow-600 to-orange-600' },
            { label: 'Pro Plan',     value: stats.pro,        color: 'from-blue-600 to-cyan-600' },
          ].map(s => (
            <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4`}>
              <p className="text-white/70 text-xs font-medium">{s.label}</p>
              <p className="text-white text-3xl font-black mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
            <input
              type="text"
              placeholder="Search by name, email or slug..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs">✕</button>
            )}
          </div>
          {/* Filter tabs */}
          <div className="flex gap-2">
            {[['all','All'],['verified','✅ Verified'],['unverified','⏳ Unverified']].map(([val,label]) => (
              <button key={val} onClick={() => setFilter(val)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  filter === val
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-purple-500 hover:text-white'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="font-bold text-white">Organizations
              <span className="ml-2 text-xs font-normal text-gray-400">({filtered.length})</span>
            </h2>
            <button onClick={fetchOrgs}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300">
              🔄 Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-500">⏳ Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-3xl mb-2">🏢</p>
              <p>{search ? `No results for "${search}"` : 'No organizations found'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Organization','Email','Plan','Status','Customers','Sessions','Joined','Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filtered.map(org => (
                    <tr key={org._id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">{org.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{org.slug}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-300">{org.email}</td>
                      <td className="px-5 py-4">
                        <select
                          value={org.plan || 'free'}
                          onChange={e => updatePlan(org, e.target.value)}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${
                            org.plan === 'enterprise' ? 'bg-purple-900 text-purple-300' :
                            org.plan === 'pro'        ? 'bg-blue-900 text-blue-300' :
                            'bg-gray-800 text-gray-400'
                          }`}>
                          {PLANS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                          org.isVerified ? 'bg-green-900/60 text-green-400' : 'bg-yellow-900/60 text-yellow-400'
                        }`}>
                          {org.isVerified ? '✅ Verified' : '⏳ Pending'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-300 text-center">{org.stats?.customers ?? 0}</td>
                      <td className="px-5 py-4 text-gray-300 text-center">{org.stats?.gameSessions ?? 0}</td>
                      <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(org.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => toggleVerified(org)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                            org.isVerified
                              ? 'bg-red-900/50 hover:bg-red-900 text-red-400'
                              : 'bg-green-900/50 hover:bg-green-900 text-green-400'
                          }`}>
                          {org.isVerified ? 'Revoke' : 'Verify'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
