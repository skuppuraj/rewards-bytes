import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(persist(
  (set) => ({
    token: null,
    user: null,
    org: null,
    setAuth: (token, user, org) => set({ token, user, org }),
    logout: () => set({ token: null, user: null, org: null })
  }),
  { name: 'rb-auth' }
));
