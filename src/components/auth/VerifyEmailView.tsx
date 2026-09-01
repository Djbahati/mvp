import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

export const VerifyEmailView: React.FC = () => {
  const { verifyEmail, resendVerification, debugCodes } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => setCountdown(c => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!code || code.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    try {
      await verifyEmail(code);
      setSuccess('Email verified successfully! Proceeding to phone OTP verification...');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      await resendVerification('email');
      setCountdown(60);
      setSuccess('New email verification code sent.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-6">
        <Mail className="w-8 h-8" />
      </div>

      <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Verify your email address</h1>
      <p className="text-xs text-slate-400 mb-6">
        We have sent a 6-digit verification code to your email address. Enter the code below to secure your account.
      </p>

      {debugCodes.emailCode && (
        <div className="mb-5 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs">
          <span className="font-semibold">Sandbox Dev Code:</span> <code className="bg-slate-950 px-2 py-0.5 rounded font-mono font-bold">{debugCodes.emailCode}</code>
        </div>
      )}

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-200 text-xs flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 text-center text-2xl font-mono tracking-widest text-white placeholder-slate-700 focus:outline-none focus:border-amber-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <span>Verify Email</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
        <span>Didn't receive code?</span>
        <button
          type="button"
          onClick={handleResend}
          disabled={countdown > 0}
          className="text-amber-400 hover:text-amber-300 font-semibold disabled:opacity-50 flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}</span>
        </button>
      </div>
    </div>
  );
};
