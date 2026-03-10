import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSuperAdminStore = create(persist(
  (set) => ({
    token: null,
    admin: null,
    setAuth: (token, admin) => set({ token, admin }),
    logout: () => set({ token: null, admin: null }),
  }),
  { name: 'rb-superadmin' }
));
