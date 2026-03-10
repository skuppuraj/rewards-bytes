import axios from 'axios';
import { useSuperAdminStore } from '../store/superAdminStore';

const superAdminApi = axios.create({ baseURL: '/api' });

superAdminApi.interceptors.request.use((config) => {
  const token = useSuperAdminStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

superAdminApi.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      useSuperAdminStore.getState().logout();
      window.location.href = '/superadmin/login';
    }
    return Promise.reject(err);
  }
);

export default superAdminApi;
