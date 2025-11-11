import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';

interface User {
  id: string;
  email: string;
  role: string;
  companyId: string | null;
}

interface Company {
  id: string;
  name: string;
  siren: string;
  address: string;
  city: string;
  postalCode: string;
}

interface Plan {
  id: string;
  name: string;
  tier: 'DECOUVERTE' | 'ESSENTIEL' | 'PRO' | 'PREMIUM';
  price: string;
  billingCycle: string;
}

interface AuthContextType {
  user: User | null;
  company: Company | null;
  plan: Plan | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Load user data from token
  const loadUserData = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Token invalid or expired, try refresh
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          const { accessToken } = await refreshResponse.json();
          localStorage.setItem('access_token', accessToken);
          // Retry loading user data
          await loadUserData();
          return;
        }

        // Refresh failed, clear auth
        localStorage.removeItem('access_token');
        setUser(null);
        setCompany(null);
        setPlan(null);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setUser(data.user);
      setCompany(data.company);
      setPlan(data.plan);
    } catch (error) {
      console.error('Failed to load user data:', error);
      localStorage.removeItem('access_token');
      setUser(null);
      setCompany(null);
      setPlan(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.accessToken);
      await loadUserData();
      setLocation('/');
    } catch (error: any) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('access_token');
      setUser(null);
      setCompany(null);
      setPlan(null);
      queryClient.clear();
      setLocation('/login');
    }
  };

  const refreshAuth = async () => {
    await loadUserData();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        plan,
        isLoading,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
