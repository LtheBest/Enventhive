import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';

interface User {
  id: string;
  email: string;
  role: string;
  companyId: string | null;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
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
  login: (email: string, password: string, remember?: boolean, captchaChallenge?: string, captchaResponse?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  authenticateWithToken: (token: string) => Promise<void>;
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

  const login = async (email: string, password: string, remember: boolean = false, captchaChallenge?: string, captchaResponse?: string) => {
    try {
      console.log('[AuthContext] Starting login with CAPTCHA:', { 
        email, 
        hasCaptchaChallenge: !!captchaChallenge, 
        hasCaptchaResponse: !!captchaResponse 
      });
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          remember,
          captchaChallenge, 
          captchaResponse 
        }),
      });

      console.log('[AuthContext] Login response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('[AuthContext] Login failed:', error);
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('[AuthContext] Login successful, received token:', { hasToken: !!data.accessToken });
      localStorage.setItem('access_token', data.accessToken);
      
      // Load user data first to get role
      console.log('[AuthContext] Fetching user data with token...');
      const userData = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${data.accessToken}`,
        },
      });
      
      console.log('[AuthContext] User data response status:', userData.status);
      
      if (userData.ok) {
        const { user: userInfo, company: companyInfo, plan: planInfo } = await userData.json();
        console.log('[AuthContext] User data loaded:', { role: userInfo.role, email: userInfo.email });
        
        // Update state first
        setUser(userInfo);
        setCompany(companyInfo);
        setPlan(planInfo);
        
        // Wait for state update to complete using setTimeout (next tick)
        // This ensures ProtectedRoute sees the updated user before redirect
        const redirectPath = userInfo.role === 'admin' ? '/admin' : '/dashboard';
        console.log('[AuthContext] Will redirect to:', redirectPath, 'after state update');
        
        setTimeout(() => {
          console.log('[AuthContext] Now redirecting to:', redirectPath);
          setLocation(redirectPath);
          console.log('[AuthContext] Login complete');
        }, 0);
      } else {
        const errorData = await userData.text();
        console.error('[AuthContext] Failed to load user data:', { status: userData.status, error: errorData });
        throw new Error('Failed to load user data');
      }
    } catch (error: any) {
      console.error('[AuthContext] Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    const currentRole = user?.role;
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
      
      // Redirect to appropriate login page based on previous role
      if (currentRole === 'admin') {
        setLocation('/admin/login');
      } else {
        setLocation('/login');
      }
    }
  };

  const refreshAuth = async () => {
    await loadUserData();
  };

  // Authenticate using an existing token (e.g., from registration)
  // This loads user data without redirecting, allowing caller to handle navigation
  const authenticateWithToken = async (token: string) => {
    try {
      localStorage.setItem('access_token', token);
      await loadUserData();
    } catch (error: any) {
      console.error('Token authentication failed:', error);
      throw error;
    }
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
        authenticateWithToken,
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
