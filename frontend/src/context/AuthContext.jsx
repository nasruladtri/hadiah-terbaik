import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const storedUser = sessionStorage.getItem('user');
            const token = sessionStorage.getItem('token');
            return (storedUser && token) ? JSON.parse(storedUser) : null;
        } catch (error) {
            console.error('Failed to parse user from local storage', error);
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('token');
            return null;
        }
    });
    const [loading] = useState(false);

    // Periodic token validation to detect session expiry or login from elsewhere
    useEffect(() => {
        if (!user) return;

        // Check token validity every 5 minutes
        const interval = setInterval(async () => {
            try {
                await api.get('/auth/me');
            } catch (error) {
                // 401 will be handled by api interceptor (auto logout)
                if (error.response?.status === 401) {
                    console.log('Session expired or logged in elsewhere');
                }
            }
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, [user]);

    const login = async (username, password) => {
        try {
            const response = await api.post('/auth/login', { username, password });
            const data = response.data.data;

            // Handle must_change_password response
            if (data.must_change_password) {
                return {
                    success: true,
                    must_change_password: true,
                    user_id: data.user_id,
                    username: data.username,
                    message: data.message
                };
            }

            const { token, user: userData } = data;

            sessionStorage.setItem('token', token);
            sessionStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            return { success: true };
        } catch (error) {
            console.error('Login failed', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const changePassword = async (userId, oldPassword, newPassword) => {
        try {
            const response = await api.put('/auth/change-password', {
                oldPassword,
                newPassword
            }, {
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`
                }
            });

            if (response.data.success) {
                // Clear token and user after password change (user needs to login again)
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('user');
                setUser(null);
                return { success: true, message: response.data.message };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            console.error('Change password failed', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Gagal mengubah password'
            };
        }
    };

    const logout = async () => {
        try {
            // Call backend logout endpoint to clear session
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
            // Continue with client-side logout even if backend call fails
        } finally {
            // Always clear local state
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            setUser(null);
            window.location.href = '/login';
        }
    };

    const value = {
        user,
        login,
        logout,
        changePassword,
        isAuthenticated: !!user
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
