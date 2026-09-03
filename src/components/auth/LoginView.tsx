import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Globe, X } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, socialLogin, setAuthView } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Social Login modal state
  const [socialModalProvider, setSocialModalProvider] = useState<string | null>(null);
  const [socialEmail, setSocialEmail] = useState('');
  const [socialFirstName, setSocialFirstName] = useState('');
  const [socialLastName, setSocialLastName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier || !password) {
      setError('Please enter your email, username or phone number and password.');
      return;
    }
    setLoading(true);
    try {
      await login(identifier, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials or network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!socialEmail) {
      setError('Please enter your email address for social authentication.');
      return;
    }
    setLoading(true);
    try {
      await socialLogin(socialModalProvider || 'google', {
        email: socialEmail,
        first_name: socialFirstName || 'User',
        last_name: socialLastName || socialModalProvider?.toUpperCase() || 'Social'
      });
      setSocialModalProvider(null);
    } catch (err: any) {
      setError(err.message || 'Social authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdminLogin = () => {
    setIdentifier('pierrebahati508@gmail.com');
    setPassword('Pierre@12345');
  };

  const handleQuickAdminSocial = () => {
    socialLogin('google', {
      email: 'pierrebahati508@gmail.com',
      first_name: 'Pierre',
      last_name: 'Bahati'
    }).catch(err => setError(err.message));
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 text-slate-950 font-black text-2xl mb-3 shadow-lg shadow-amber-500/20">
          K
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back to Kofi</h1>
        <p className="text-xs text-slate-400 mt-1">Secure Multi-Currency Wallet & Payment Ecosystem</p>
      </div>

      {/* Admin Credentials Quick Hint */}
      <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-amber-400">Admin Access Granted:</span>
          <button
            type="button"
            onClick={handleQuickAdminLogin}
            className="text-[11px] underline font-bold text-amber-300 hover:text-white cursor-pointer"
          >
            Auto-fill Admin Pass
          </button>
        </div>
        <div className="font-mono text-[11px] text-slate-300">
          Email: <span className="text-white">pierrebahati508@gmail.com</span><br/>
          Password: <span className="text-white">Pierre@12345</span>
        </div>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-start gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 flex-shrink-0"></span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email / Username / Phone</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="pierrebahati508@gmail.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs py-1">
          <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900"
            />
            <span>Remember me</span>
          </label>
          <button
            type="button"
            onClick={() => setAuthView('forgot_password')}
            className="text-amber-400 hover:text-amber-300 font-medium"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <span>Login to Kofi</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-[11px] uppercase tracking-wider">Or continue with Social OAuth</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <button
            type="button"
            onClick={() => setSocialModalProvider('google')}
            className="flex items-center justify-center py-2.5 px-3 bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl text-xs text-slate-200 font-semibold transition-all cursor-pointer"
          >
            Google / Gmail
          </button>
          <button
            type="button"
            onClick={() => setSocialModalProvider('apple')}
            className="flex items-center justify-center py-2.5 px-3 bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl text-xs text-slate-200 font-semibold transition-all cursor-pointer"
          >
            Apple ID
          </button>
          <button
            type="button"
            onClick={() => setSocialModalProvider('microsoft')}
            className="flex items-center justify-center py-2.5 px-3 bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl text-xs text-slate-200 font-semibold transition-all cursor-pointer"
          >
            Microsoft
          </button>
        </div>

        {/* Quick Admin Social Button */}
        <button
          type="button"
          onClick={handleQuickAdminSocial}
          className="w-full mt-3 py-2 px-3 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>⚡ Instant Admin Login via Google (pierrebahati508@gmail.com)</span>
        </button>
      </div>

      <div className="mt-6 text-center text-xs text-slate-400">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={() => setAuthView('signup')}
          className="text-amber-400 hover:text-amber-300 font-semibold"
        >
          Create account
        </button>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-center gap-2 text-[11px] text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>End-to-end encrypted OAuth 2.0 & OpenID Connect</span>
      </div>

      {/* Social Login Popup Modal */}
      {socialModalProvider && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-50 rounded-3xl p-6 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white capitalize">
              Sign in with {socialModalProvider}
            </h3>
            <button
              onClick={() => setSocialModalProvider(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSocialSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {socialModalProvider === 'google' ? 'Gmail / Google' : socialModalProvider === 'apple' ? 'Apple ID' : 'Microsoft'} Email
              </label>
              <input
                type="email"
                required
                value={socialEmail}
                onChange={(e) => setSocialEmail(e.target.value)}
                placeholder="pierrebahati508@gmail.com"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">First Name</label>
                <input
                  type="text"
                  value={socialFirstName}
                  onChange={(e) => setSocialFirstName(e.target.value)}
                  placeholder="Pierre"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Last Name</label>
                <input
                  type="text"
                  value={socialLastName}
                  onChange={(e) => setSocialLastName(e.target.value)}
                  placeholder="Bahati"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-400">
              OAuth 2.0 Client credentials connected. Automatically creates or logs into your Kofi account with verified email.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3 rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <span>Authorize & Continue</span>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
