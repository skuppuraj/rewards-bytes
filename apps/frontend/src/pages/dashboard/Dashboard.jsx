import { Routes, Route } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileSidebar';
import Overview from './Overview';
import Players from './Players';
import Games from './Games';
import Coupons from './Coupons';

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="hidden lg:flex">
        <Sidebar />
      </div>
      <MobileNav />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route index element={<Overview />} />
          <Route path="players" element={<Players />} />
          <Route path="games" element={<Games />} />
          <Route path="coupons" element={<Coupons />} />
        </Routes>
      </main>
    </div>
  );
}
