import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../api';

interface User {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user_data');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const { user: userData, token: authToken } = response.data.data;

    setToken(authToken);
    setUser(userData);
    localStorage.setItem('auth_token', authToken);
    localStorage.setItem('user_data', JSON.stringify(userData));
  };

  const register = async (data: any) => {
    const response = await authApi.register(data);
    const { user: userData, token: authToken } = response.data.data;

    setToken(authToken);
    setUser(userData);
    localStorage.setItem('auth_token', authToken);
    localStorage.setItem('user_data', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.roles?.some(r => r.toLowerCase() === 'admin') ?? false;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isAdmin, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
