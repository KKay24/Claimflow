import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'APPLICANT' | 'REVIEWER';
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if token and user exist in local storage on load
    const storedToken = localStorage.getItem('claimflow_token');
    const storedUser = localStorage.getItem('claimflow_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, user: userProfile } = response.data;
    
    setToken(accessToken);
    setUser(userProfile);
    
    localStorage.setItem('claimflow_token', accessToken);
    localStorage.setItem('claimflow_user', JSON.stringify(userProfile));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('claimflow_token');
    localStorage.removeItem('claimflow_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
