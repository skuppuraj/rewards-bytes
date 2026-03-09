import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm"
        onClick={() => setOpen(true)}
      >
        <Menu className="w-4 h-4 text-gray-600" />
      </button>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-64 h-full">
            <button
              className="absolute top-4 right-[-48px] w-9 h-9 bg-white rounded-lg flex items-center justify-center z-50"
              onClick={() => setOpen(false)}
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
            <Sidebar />
          </div>
        </div>
      )}
    </>
  );
}
