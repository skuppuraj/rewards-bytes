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
  const [copied, setCopied] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const portalSlug = org?.slug;
  const portalUrl = portalSlug
    ? `${window.location.origin}/play/${portalSlug}`
    : null;

  const handleCopy = () => {
    if (!portalUrl) return;
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        {/* Logo / Org */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-sm">R</div>
            <div>
              <p className="font-semibold text-sm text-gray-900">{org?.name || 'RewardBytes'}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
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

        {/* Customer Game Page URL */}
        <div className="mx-3 mb-3 rounded-xl overflow-hidden border border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50">
          <div className="px-3 pt-3 pb-1 flex items-center gap-1.5">
            <span className="text-sm">🎮</span>
            <p className="text-xs font-semibold text-purple-700">Customer Game Page</p>
          </div>
          {portalUrl ? (
            <div className="px-3 pb-3">
              <a
                href={portalUrl}
                target="_blank"
                rel="noreferrer"
                className="block text-[11px] text-purple-500 truncate hover:text-purple-700 hover:underline mb-2 font-mono"
                title={portalUrl}
              >
                /play/{portalSlug}
              </a>
              <div className="flex gap-1.5">
                <button
                  onClick={handleCopy}
                  className={`flex-1 text-[11px] font-semibold py-1.5 rounded-lg transition-all ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {copied ? '✅ Copied!' : '📋 Copy Link'}
                </button>
                <a
                  href={portalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-white border border-purple-200 text-purple-600 text-[11px] font-semibold hover:bg-purple-50"
                >
                  ↗
                </a>
              </div>
            </div>
          ) : (
            <div className="px-3 pb-3">
              <p className="text-[11px] text-gray-400 mb-2">No slug set yet.</p>
              <NavLink
                to="/settings"
                className="block text-center text-[11px] font-semibold py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
              >
                ⚙️ Set up in Settings
              </NavLink>
            </div>
          )}
        </div>

        {/* Logout */}
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
