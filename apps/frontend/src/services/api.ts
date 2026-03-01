import axios from 'axios';
import { useAuthStore } from '../state/auth.store';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
});

// Attach JWT token
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Unwrap the { success, data } envelope automatically so callers get the inner `data`
api.interceptors.response.use(
    (response) => {
        // Backend returns { success: true, data: <actual payload> }
        // Unwrap so callers see response.data = <actual payload>
        if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
            response.data = response.data.data;
        }
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
