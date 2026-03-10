import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/dashboard/Dashboard';
import GamesPage from './pages/games/GamesPage';
import OffersPage from './pages/offers/OffersPage';
import GameHistoryPage from './pages/gameHistory/GameHistoryPage';
import CustomersPage from './pages/customers/CustomersPage';
import CouponsPage from './pages/coupons/CouponsPage';
import OrgSettingsPage from './pages/settings/OrgSettingsPage';
import StaffPage from './pages/staff/StaffPage';
import ReviewsPage from './pages/reviews/ReviewsPage';
// Customer portal
import GamePortal from './pages/portal/GamePortal';
import PortalLogin from './pages/portal/PortalLogin';
import GamesList from './pages/portal/GamesList';
import GameStart from './pages/portal/GameStart';
import PlaySpinWheel from './pages/portal/games/PlaySpinWheel';
import PlayScratchCard from './pages/portal/games/PlayScratchCard';
import PlayCatchPopcorn from './pages/portal/games/PlayCatchPopcorn';
import GameComplete from './pages/portal/GameComplete';
import CustomerDashboard from './pages/portal/CustomerDashboard';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role === 'staff') return <Navigate to="/coupons" replace />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Admin */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"    element={<PrivateRoute adminOnly><Dashboard /></PrivateRoute>} />
          <Route path="games"        element={<PrivateRoute adminOnly><GamesPage /></PrivateRoute>} />
          <Route path="offers"       element={<PrivateRoute adminOnly><OffersPage /></PrivateRoute>} />
          <Route path="game-history" element={<PrivateRoute adminOnly><GameHistoryPage /></PrivateRoute>} />
          <Route path="customers"    element={<PrivateRoute adminOnly><CustomersPage /></PrivateRoute>} />
          <Route path="coupons"      element={<CouponsPage />} />
          <Route path="reviews"      element={<PrivateRoute adminOnly><ReviewsPage /></PrivateRoute>} />
          <Route path="settings"     element={<PrivateRoute adminOnly><OrgSettingsPage /></PrivateRoute>} />
          <Route path="staff"        element={<PrivateRoute adminOnly><StaffPage /></PrivateRoute>} />
        </Route>
        {/* Customer Portal */}
        <Route path="/play/:orgSlug" element={<GamePortal />}>
          <Route index element={<GamesList />} />
          <Route path="login" element={<PortalLogin />} />
          <Route path="dashboard" element={<CustomerDashboard />} />
          <Route path="start/:orgGameId" element={<GameStart />} />
          <Route path="play/spin/:sessionId" element={<PlaySpinWheel />} />
          <Route path="play/scratch/:sessionId" element={<PlayScratchCard />} />
          <Route path="play/popcorn/:sessionId" element={<PlayCatchPopcorn />} />
          <Route path="complete/:sessionId" element={<GameComplete />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
