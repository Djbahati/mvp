import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  userRole: UserRole | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  loading: boolean;
  authView: 'login' | 'signup' | 'verify_email' | 'verify_phone' | 'forgot_password' | 'reset_password';
  setAuthView: (view: 'login' | 'signup' | 'verify_email' | 'verify_phone' | 'forgot_password' | 'reset_password') => void;
  pendingUserId: string | null;
  setPendingUserId: (id: string | null) => void;
  debugCodes: { emailCode?: string; phoneCode?: string; resetToken?: string };
  login: (identifier: string, pass: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  verifyPhone: (code: string) => Promise<void>;
  resendVerification: (type: 'email' | 'phone') => Promise<void>;
  forgotPassword: (identifier: string) => Promise<void>;
  resetPassword: (token: string, newPass: string) => Promise<void>;
  socialLogin: (provider: string, profile: { email: string; first_name?: string; last_name?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authView, setAuthView] = useState<'login' | 'signup' | 'verify_email' | 'verify_phone' | 'forgot_password' | 'reset_password'>('login');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [debugCodes, setDebugCodes] = useState<{ emailCode?: string; phoneCode?: string; resetToken?: string }>({});

  useEffect(() => {
    const token = localStorage.getItem('kofi_access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    authService.getCurrentUser(token)
      .then(res => {
        if (res.success && res.data?.user) {
          setCurrentUser(res.data.user);
        } else {
          localStorage.removeItem('kofi_access_token');
          localStorage.removeItem('kofi_refresh_token');
        }
      })
      .catch(() => {
        localStorage.removeItem('kofi_access_token');
        localStorage.removeItem('kofi_refresh_token');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (identifier: string, pass: string) => {
    setLoading(true);
    try {
      const res = await authService.login(identifier, pass);
      if (res.success && res.data) {
        localStorage.setItem('kofi_access_token', res.data.accessToken);
        localStorage.setItem('kofi_refresh_token', res.data.refreshToken);
        setCurrentUser(res.data.user);
      } else {
        throw new Error(res.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: any) => {
    setLoading(true);
    try {
      const res = await authService.signup(data);
      if (res.success && res.data) {
        localStorage.setItem('kofi_access_token', res.data.accessToken);
        localStorage.setItem('kofi_refresh_token', res.data.refreshToken);
        setCurrentUser(res.data.user);
        setPendingUserId(res.data.user.id);
        if (res.data.debug_verification) {
          setDebugCodes({
            emailCode: res.data.debug_verification.emailCode,
            phoneCode: res.data.debug_verification.phoneCode
          });
        }
        setAuthView('verify_email');
      } else {
        throw new Error(res.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const token = localStorage.getItem('kofi_access_token');
    if (token) {
      try {
        await authService.logout(token);
      } catch (e) {
        // ignore
      }
    }
    localStorage.removeItem('kofi_access_token');
    localStorage.removeItem('kofi_refresh_token');
    setCurrentUser(null);
    setAuthView('login');
  };

  const logoutAll = async () => {
    const token = localStorage.getItem('kofi_access_token');
    if (token) {
      try {
        await authService.logoutAll(token);
      } catch (e) {
        // ignore
      }
    }
    localStorage.removeItem('kofi_access_token');
    localStorage.removeItem('kofi_refresh_token');
    setCurrentUser(null);
    setAuthView('login');
  };

  const verifyEmail = async (code: string) => {
    if (!pendingUserId && !currentUser) throw new Error('No user pending verification');
    const uid = pendingUserId || currentUser?.id;
    const res = await authService.verifyEmail(uid!, code);
    if (res.success) {
      if (res.data?.user) setCurrentUser(res.data.user);
      setAuthView('verify_phone');
    } else {
      throw new Error(res.message || 'Email verification failed');
    }
  };

  const verifyPhone = async (code: string) => {
    if (!pendingUserId && !currentUser) throw new Error('No user pending verification');
    const uid = pendingUserId || currentUser?.id;
    const res = await authService.verifyPhone(uid!, code);
    if (res.success) {
      if (res.data?.user) setCurrentUser(res.data.user);
      setPendingUserId(null);
      // fully active, user is logged in
    } else {
      throw new Error(res.message || 'Phone verification failed');
    }
  };

  const resendVerification = async (type: 'email' | 'phone') => {
    const uid = pendingUserId || currentUser?.id;
    if (!uid) throw new Error('User not found');
    const res = await authService.resendVerification(uid, type);
    if (res.success && res.debug_code) {
      setDebugCodes(prev => ({
        ...prev,
        [type === 'email' ? 'emailCode' : 'phoneCode']: res.debug_code
      }));
    }
  };

  const forgotPassword = async (identifier: string) => {
    const res = await authService.forgotPassword(identifier);
    if (res.success && res.debug_reset_token) {
      setDebugCodes(prev => ({ ...prev, resetToken: res.debug_reset_token }));
    }
  };

  const resetPassword = async (token: string, newPass: string) => {
    const res = await authService.resetPassword(token, newPass);
    if (!res.success) {
      throw new Error(res.message || 'Password reset failed');
    }
    setAuthView('login');
  };

  const socialLogin = async (provider: string, profile: { email: string; first_name?: string; last_name?: string }) => {
    setLoading(true);
    try {
      const res = await authService.socialLogin(provider, profile);
      if (res.success && res.data) {
        localStorage.setItem('kofi_access_token', res.data.accessToken);
        localStorage.setItem('kofi_refresh_token', res.data.refreshToken);
        setCurrentUser(res.data.user);
      } else {
        throw new Error(res.message || 'Social login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const value = {
    isAuthenticated: !!currentUser && currentUser.account_status === 'ACTIVE',
    currentUser,
    userRole: currentUser?.role || null,
    emailVerified: currentUser?.email_verified || false,
    phoneVerified: currentUser?.phone_verified || false,
    loading,
    authView,
    setAuthView,
    pendingUserId,
    setPendingUserId,
    debugCodes,
    login,
    signup,
    logout,
    logoutAll,
    verifyEmail,
    verifyPhone,
    resendVerification,
    forgotPassword,
    resetPassword,
    socialLogin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
