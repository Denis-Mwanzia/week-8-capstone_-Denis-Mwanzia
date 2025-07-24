import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('tukomaji_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const userData = response.data;
      setUser(userData.user);
      localStorage.setItem('tukomaji_user', JSON.stringify(userData.user));
      localStorage.setItem('tukomaji_token', userData.token);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login error:', error.message || error);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', userData);
      const result = response.data;
      setUser(result.user);
      localStorage.setItem('tukomaji_user', JSON.stringify(result.user));
      localStorage.setItem('tukomaji_token', result.token);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Registration error:', error.message || error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tukomaji_user');
    localStorage.removeItem('tukomaji_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
