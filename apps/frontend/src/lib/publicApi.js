import axios from 'axios';
import { useCustomerStore } from '../store/customerStore';

const publicApi = axios.create({ baseURL: '/api/public' });

publicApi.interceptors.request.use((config) => {
  const token = useCustomerStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default publicApi;
