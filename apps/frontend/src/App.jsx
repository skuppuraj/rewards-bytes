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
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<PrivateRoute adminOnly><Dashboard /></PrivateRoute>} />
          <Route path="games" element={<PrivateRoute adminOnly><GamesPage /></PrivateRoute>} />
          <Route path="offers" element={<PrivateRoute adminOnly><OffersPage /></PrivateRoute>} />
          <Route path="game-history" element={<PrivateRoute adminOnly><GameHistoryPage /></PrivateRoute>} />
          <Route path="customers" element={<PrivateRoute adminOnly><CustomersPage /></PrivateRoute>} />
          <Route path="coupons" element={<CouponsPage />} />
          <Route path="settings" element={<PrivateRoute adminOnly><OrgSettingsPage /></PrivateRoute>} />
          <Route path="staff" element={<PrivateRoute adminOnly><StaffPage /></PrivateRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
