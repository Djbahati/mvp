import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LoginView } from './LoginView';
import { SignupView } from './SignupView';
import { VerifyEmailView } from './VerifyEmailView';
import { VerifyPhoneView } from './VerifyPhoneView';
import { ForgotPasswordView } from './ForgotPasswordView';
import { ResetPasswordView } from './ResetPasswordView';
import { Shield, Zap, Lock, Globe } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { authView } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header branding */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-md">
            K
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white">Kofi App</span>
            <span className="block text-[10px] text-amber-400 font-medium tracking-wider uppercase">Secure Financial Ecosystem</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Bank-Grade Security</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Lightning & MoMo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>Multi-Region Access</span>
          </div>
        </div>
      </header>

      {/* Main Form Center Stage */}
      <main className="flex-grow flex items-center justify-center px-4 py-8 relative z-10">
        {authView === 'login' && <LoginView />}
        {authView === 'signup' && <SignupView />}
        {authView === 'verify_email' && <VerifyEmailView />}
        {authView === 'verify_phone' && <VerifyPhoneView />}
        {authView === 'forgot_password' && <ForgotPasswordView />}
        {authView === 'reset_password' && <ResetPasswordView />}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 text-center text-xs text-slate-500 relative z-10 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          © {new Date().getFullYear()} Kofi Technologies Inc. All rights reserved.
        </div>
        <div className="flex items-center gap-6 text-[11px] text-slate-400">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Security & KYC</a>
          <a href="#" className="hover:text-white transition-colors">API Documentation</a>
        </div>
      </footer>
    </div>
  );
};
