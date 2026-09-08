import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';

export const ResetPasswordView: React.FC = () => {
  const { resetPassword, debugCodes, setAuthView } = useAuth();
  const [token, setToken] = useState(debugCodes.resetToken || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Password reset token is required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Create New Password</h1>
        <p className="text-xs text-slate-400 mt-1">Enter your secure reset token and new password</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs">
          {error}
        </div>
      )}

      {success ? (
        <div className="space-y-6 text-center">
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-xs">
            Password reset successfully! You can now log in with your new credentials.
          </div>
          <button
            type="button"
            onClick={() => setAuthView('login')}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all text-xs"
          >
            Proceed to Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Reset Token</label>
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste reset token..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
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

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Update Password</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
