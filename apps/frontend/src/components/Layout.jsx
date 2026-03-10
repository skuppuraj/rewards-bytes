import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import OrgTopbar from './OrgTopbar';
import PlanExpiredGuard from './PlanExpiredGuard';

const navItems = [
  { path: 'dashboard',    label: 'Dashboard',    icon: '📊', adminOnly: true },
  { path: 'games',        label: 'Games',        icon: '🎮', adminOnly: true },
  { path: 'offers',       label: 'Offers',       icon: '🏷️', adminOnly: true },
  { path: 'game-history', label: 'Game History', icon: '📜', adminOnly: true },
  { path: 'customers',    label: 'Customers',    icon: '👥', adminOnly: true },
  { path: 'reviews',      label: 'Reviews',      icon: '⭐', adminOnly: true },
  { path: 'coupons',      label: 'Coupons',      icon: '🏟️', adminOnly: false },
  { path: 'staff',        label: 'Staff',        icon: '👤', adminOnly: true },
  { path: 'settings',     label: 'Settings',     icon: '⚙️', adminOnly: true },
  { path: 'account',      label: 'Account',      icon: '💳', adminOnly: true },
];

export default function Layout() {
  const { user, org, logout } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const isStaff   = user?.role === 'staff';
  const [copied, setCopied]       = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile nav)
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const portalSlug = org?.slug;
  const portalUrl  = portalSlug ? `${window.location.origin}/play/${portalSlug}` : null;

  const handleCopy = () => {
    if (!portalUrl) return;
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const SidebarContent = (
    <aside className="w-64 bg-white flex flex-col h-full">
      {/* Logo + close button (mobile only) */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-sm">R</div>
          <div>
            <p className="font-semibold text-sm text-gray-900">{org?.name || 'RewardBytes'}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
          aria-label="Close menu"
        >
          ✕
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems
          .filter(item => !isStaff || !item.adminOnly)
          .map(item => (
            <NavLink key={item.path} to={`/${item.path}`}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span>{item.icon}</span><span>{item.label}</span>
            </NavLink>
          ))}
      </nav>

      {/* Portal URL widget */}
      <div className="mx-3 mb-3 rounded-xl overflow-hidden border border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="px-3 pt-3 pb-1 flex items-center gap-1.5">
          <span className="text-sm">🎮</span>
          <p className="text-xs font-semibold text-purple-700">Customer Game Page</p>
        </div>
        {portalUrl ? (
          <div className="px-3 pb-3">
            <a href={portalUrl} target="_blank" rel="noreferrer"
              className="block text-[11px] text-purple-500 truncate hover:text-purple-700 hover:underline mb-2 font-mono"
              title={portalUrl}>/play/{portalSlug}</a>
            <div className="flex gap-1.5">
              <button onClick={handleCopy}
                className={`flex-1 text-[11px] font-semibold py-1.5 rounded-lg transition-all ${
                  copied ? 'bg-green-500 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}>{copied ? '✅ Copied!' : '📋 Copy Link'}</button>
              <a href={portalUrl} target="_blank" rel="noreferrer"
                className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-white border border-purple-200 text-purple-600 text-[11px] font-semibold hover:bg-purple-50">↗</a>
            </div>
          </div>
        ) : (
          <div className="px-3 pb-3">
            <p className="text-[11px] text-gray-400 mb-2">No slug set yet.</p>
            <NavLink to="/settings"
              className="block text-center text-[11px] font-semibold py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700">⚙️ Set up in Settings</NavLink>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-100">
        <button onClick={handleLogout} className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600">
          <span>🚣</span><span>Logout</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* ── Desktop sidebar (always visible on md+) ── */}
      <div className="hidden md:flex w-64 border-r border-gray-100 flex-shrink-0">
        {SidebarContent}
      </div>

      {/* ── Mobile sidebar (drawer + backdrop) ── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 md:hidden ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />
      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 shadow-xl transition-transform duration-200 md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {SidebarContent}
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Pass hamburger toggle to topbar */}
        <OrgTopbar onMenuClick={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 overflow-y-auto">
          <PlanExpiredGuard>
            <Outlet />
          </PlanExpiredGuard>
        </main>
      </div>
    </div>
  );
}
