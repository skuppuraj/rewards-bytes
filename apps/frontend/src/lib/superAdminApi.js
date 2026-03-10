import axios from 'axios';
import { useSuperAdminStore } from '../store/superAdminStore';

const superAdminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

superAdminApi.interceptors.request.use(config => {
  const token = useSuperAdminStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default superAdminApi;
