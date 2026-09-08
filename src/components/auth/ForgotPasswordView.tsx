import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, Mail, ArrowRight, ArrowLeft } from 'lucide-react';

export const ForgotPasswordView: React.FC = () => {
  const { forgotPassword, setAuthView, debugCodes } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier) {
      setError('Please enter your email or phone number.');
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(identifier);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4">
          <KeyRound className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Reset your password</h1>
        <p className="text-xs text-slate-400 mt-1">Enter your email or phone to receive reset instructions</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs">
          {error}
        </div>
      )}

      {submitted ? (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-xs text-center space-y-2">
            <p className="font-semibold">Reset instructions sent!</p>
            <p className="text-slate-300">If an account exists with that identifier, a secure reset link/token has been generated.</p>
          </div>

          {debugCodes.resetToken && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block mb-1">Sandbox Reset Token:</span>
              <button
                type="button"
                onClick={() => setAuthView('reset_password')}
                className="text-amber-400 hover:text-amber-300 text-xs font-mono font-bold underline cursor-pointer"
              >
                Click here to set new password with token
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setAuthView('login')}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Login</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email or Phone Number</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="user@kofi.app or +250..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Send Reset Code</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setAuthView('login')}
              className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
