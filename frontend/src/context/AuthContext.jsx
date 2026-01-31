/**
 * Auth Context
 * 
 * Provides authentication state and methods throughout the app.
 * Handles login, logout, and persisting auth state.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize from localStorage
    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    // Register new user
    const register = async (userData) => {
        try {
            setError(null);
            const response = await authAPI.register(userData);
            const { access_token, user: newUser } = response.data;

            // Save to state and localStorage
            setToken(access_token);
            setUser(newUser);
            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(newUser));

            return { success: true };
        } catch (err) {
            const message = err.response?.data?.detail || 'Registration failed';
            setError(message);
            return { success: false, error: message };
        }
    };

    // Login user
    const login = async (email, password) => {
        try {
            setError(null);
            const response = await authAPI.login({ email, password });
            const { access_token, user: loggedInUser } = response.data;

            // Save to state and localStorage
            setToken(access_token);
            setUser(loggedInUser);
            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(loggedInUser));

            return { success: true };
        } catch (err) {
            const message = err.response?.data?.detail || 'Login failed';
            setError(message);
            return { success: false, error: message };
        }
    };

    // Logout user
    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    // Check if user is authenticated
    const isAuthenticated = !!token && !!user;

    // Check user role
    const isHR = user?.role === 'hr';
    const isCandidate = user?.role === 'candidate';

    const value = {
        user,
        token,
        loading,
        error,
        isAuthenticated,
        isHR,
        isCandidate,
        register,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
