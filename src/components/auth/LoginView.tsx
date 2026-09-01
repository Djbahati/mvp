import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, setAuthView } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 text-slate-950 font-black text-2xl mb-4 shadow-lg shadow-amber-500/20">
          K
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back to Kofi</h1>
        <p className="text-sm text-slate-400 mt-1">Secure Multi-Currency Wallet & Payment Ecosystem</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-start gap-2.5">
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
              placeholder="e.g. user@kofi.app or +250..."
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
          <span className="flex-shrink mx-4 text-slate-500 text-[11px] uppercase tracking-wider">Or continue with</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <button
            type="button"
            onClick={() => alert('Google Social Login architecture is pre-configured. Connect OAuth credentials in settings.')}
            className="flex items-center justify-center py-2.5 px-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-300 font-medium transition-colors"
          >
            Google
          </button>
          <button
            type="button"
            onClick={() => alert('Apple ID Social Login architecture is pre-configured.')}
            className="flex items-center justify-center py-2.5 px-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-300 font-medium transition-colors"
          >
            Apple
          </button>
          <button
            type="button"
            onClick={() => alert('Microsoft Account architecture is pre-configured.')}
            className="flex items-center justify-center py-2.5 px-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-300 font-medium transition-colors"
          >
            Microsoft
          </button>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-slate-400">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={() => setAuthView('signup')}
          className="text-amber-400 hover:text-amber-300 font-semibold"
        >
          Create account
        </button>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-center gap-2 text-[11px] text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>End-to-end encrypted ledger & biometric-ready session</span>
      </div>
    </div>
  );
};
