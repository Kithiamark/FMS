import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { setAuthToken } from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        const response = await api.get('/auth/me/');
        setUser(response.data);
        return response.data;
    };

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // On app load we trust stored tokens only after `/auth/me/` succeeds.
                // This prevents protected pages from rendering with stale localStorage state.
                await refreshUser();
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (phone_number, password) => {
        const { data } = await api.post('/auth/login/', { phone_number, password });
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        setAuthToken(data.access);
        // Fetch the full user object after login because route guards and layouts need
        // role and farm data, not just a token pair.
        return await refreshUser();
    };

    const register = async (data) => {
        await api.post('/auth/register/', data);
    };

    const logout = async () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setAuthToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
