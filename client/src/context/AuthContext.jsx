import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('aranya_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi.me()
      .then(setCustomer)
      .catch(() => localStorage.removeItem('aranya_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { customer, token } = await authApi.login({ email, password });
    localStorage.setItem('aranya_token', token);
    setCustomer(customer);
    return customer;
  }, []);

  const register = useCallback(async (payload) => {
    const { customer, token } = await authApi.register(payload);
    localStorage.setItem('aranya_token', token);
    setCustomer(customer);
    return customer;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('aranya_token');
    setCustomer(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const updated = await authApi.me();
    setCustomer(updated);
    return updated;
  }, []);

  return (
    <AuthContext.Provider value={{ customer, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
