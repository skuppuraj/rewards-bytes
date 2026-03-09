import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Auth pages
import SignupPage from './pages/auth/SignupPage';
import LoginPage from './pages/auth/LoginPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';

// Admin layout & pages
import AdminLayout from './layouts/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import GamesPage from './pages/admin/GamesPage';
import OffersPage from './pages/admin/OffersPage';
import CustomersPage from './pages/admin/CustomersPage';
import GameHistoryPage from './pages/admin/GameHistoryPage';
import CouponsPage from './pages/admin/CouponsPage';
import OrganizationPage from './pages/admin/OrganizationPage';
import StaffPage from './pages/admin/StaffPage';

// Customer-facing pages
import CustomerGamePage from './pages/customer/CustomerGamePage';
import GamePlayPage from './pages/customer/GamePlayPage';
import GameCompletePage from './pages/customer/GameCompletePage';

const ProtectedRoute = ({ children, allowedRoles = ['owner', 'staff'] }) => {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Customer game pages */}
        <Route path="/play/:slug" element={<CustomerGamePage />} />
        <Route path="/play/:slug/game/:gameId" element={<GamePlayPage />} />
        <Route path="/play/:slug/complete" element={<GameCompletePage />} />

        {/* Admin routes */}
        <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="games" element={<GamesPage />} />
          <Route path="offers" element={<OffersPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="game-history" element={<GameHistoryPage />} />
          <Route path="coupons" element={<ProtectedRoute allowedRoles={['owner', 'staff']}><CouponsPage /></ProtectedRoute>} />
          <Route path="organization" element={<ProtectedRoute allowedRoles={['owner']}><OrganizationPage /></ProtectedRoute>} />
          <Route path="staff" element={<ProtectedRoute allowedRoles={['owner']}><StaffPage /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
