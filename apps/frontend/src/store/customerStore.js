import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCustomerStore = create(persist(
  (set) => ({
    token: null,
    customer: null,
    org: null,
    settings: null,
    setCustomerAuth: (token, customer, org, settings) => set({ token, customer, org, settings }),
    logout: () => set({ token: null, customer: null, org: null, settings: null })
  }),
  { name: 'rb-customer' }
));
