import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSuperAdminStore } from '../../store/superAdminStore';

const navItems = [
  { path: '/superadmin/dashboard', label: 'Organizations', icon: '🏢' },
  { path: '/superadmin/plans',     label: 'Plans',          icon: '💳' },
  { path: '/superadmin/razorpay',  label: 'Razorpay',       icon: '💸' },
];

export default function SuperAdminLayout() {
  const { admin, logout } = useSuperAdminStore();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/superadmin/login'); };

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center font-black text-sm">R</div>
            <div>
              <p className="font-bold text-sm">RewardBytes</p>
              <p className="text-xs text-gray-500">Super Admin</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-purple-600/20 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}>
              <span>{item.icon}</span><span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800">
          <p className="text-xs text-gray-500 px-3 mb-2 truncate">{admin?.email}</p>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-900/20 transition-colors">
            <span>🚪</span><span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto"><Outlet /></main>
    </div>
  );
}
