import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const navItems = [
  { path: 'dashboard', label: 'Dashboard', icon: '📊', adminOnly: true },
  { path: 'games', label: 'Games', icon: '🎮', adminOnly: true },
  { path: 'offers', label: 'Offers', icon: '🏷️', adminOnly: true },
  { path: 'game-history', label: 'Game History', icon: '📜', adminOnly: true },
  { path: 'customers', label: 'Customers', icon: '👥', adminOnly: true },
  { path: 'coupons', label: 'Coupons', icon: '🎟️', adminOnly: false },
  { path: 'staff', label: 'Staff', icon: '👤', adminOnly: true },
  { path: 'settings', label: 'Settings', icon: '⚙️', adminOnly: true },
];

export default function Layout() {
  const { user, org, logout } = useAuthStore();
  const navigate = useNavigate();
  const isStaff = user?.role === 'staff';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-sm">R</div>
            <div>
              <p className="font-semibold text-sm text-gray-900">{org?.name || 'RewardBytes'}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems
            .filter(item => !isStaff || !item.adminOnly)
            .map(item => (
              <NavLink
                key={item.path}
                to={`/${item.path}`}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button onClick={handleLogout} className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600">
            <span>🚪</span><span>Logout</span>
          </button>
        </div>
      </aside>
      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
