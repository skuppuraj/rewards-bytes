import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      organization: null,
      setAuth: (user, token, organization) => set({ user, token, organization }),
      updateOrganization: (organization) => set({ organization }),
      logout: () => set({ user: null, token: null, organization: null }),
    }),
    { name: 'rewards-bytes-auth' }
  )
);
