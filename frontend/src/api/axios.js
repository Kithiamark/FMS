import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: false,
});

export const setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common.Authorization;
    }
};

setAuthToken(localStorage.getItem('access_token'));

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        // Retry a failed request once after refreshing JWT. If this block starts looping,
        // inspect the refresh endpoint response and make sure `_retry` is still being set.
        if (error.response?.status === 401 && !originalRequest._retry) {
            const refresh = localStorage.getItem('refresh_token');
            if (!refresh) {
                return Promise.reject(error);
            }
            originalRequest._retry = true;
            try {
                const { data } = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh });
                if (data.access) {
                    localStorage.setItem('access_token', data.access);
                    setAuthToken(data.access);
                    originalRequest.headers = {
                        ...originalRequest.headers,
                        Authorization: `Bearer ${data.access}`,
                    };
                }
                return api(originalRequest);
            } catch (err) {
                // A failed refresh means the browser session is no longer valid.
                // Clearing both tokens lets ProtectedRoute send the user back to login cleanly.
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                setAuthToken(null);
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
