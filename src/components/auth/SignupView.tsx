import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, User, Phone, Globe, ArrowRight, ShieldCheck } from 'lucide-react';

export const SignupView: React.FC = () => {
  const { signup, setAuthView } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone_number: '',
    country: 'Rwanda',
    password: '',
    confirm_password: '',
    terms_accepted: false,
    privacy_accepted: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.first_name || !formData.last_name || !formData.username || !formData.email || !formData.phone_number || !formData.country || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (!formData.terms_accepted || !formData.privacy_accepted) {
      setError('You must accept the Terms & Conditions and Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      await signup(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 text-slate-950 font-black text-xl mb-3 shadow-lg shadow-amber-500/20">
          K
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Create your Kofi account</h1>
        <p className="text-xs text-slate-400 mt-0.5">Join the secure multi-currency financial ecosystem</p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-start gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 flex-shrink-0"></span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">First name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                name="first_name"
                required
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Peter"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Last name</label>
            <input
              type="text"
              name="last_name"
              required
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Bahati"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Username</label>
            <input
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              placeholder="peter_bahati"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Country</label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 appearance-none"
              >
                <option value="Rwanda">Rwanda</option>
                <option value="Kenya">Kenya</option>
                <option value="Uganda">Uganda</option>
                <option value="Tanzania">Tanzania</option>
                <option value="Nigeria">Nigeria</option>
                <option value="Ghana">Ghana</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Germany">Germany</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="peter@kofi.app"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">Phone number (Mobile Money / SMS)</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="tel"
              name="phone_number"
              required
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="+250 780 000 000"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 8 chars"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-9 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Confirm password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirm_password"
              required
              value={formData.confirm_password}
              onChange={handleChange}
              placeholder="Confirm password"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="space-y-2 pt-1 text-xs">
          <label className="flex items-start gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
            <input
              type="checkbox"
              name="terms_accepted"
              checked={formData.terms_accepted}
              onChange={handleChange}
              className="mt-0.5 rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-amber-500"
            />
            <span>I agree to the <span className="text-amber-400 underline">Terms & Conditions</span></span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
            <input
              type="checkbox"
              name="privacy_accepted"
              checked={formData.privacy_accepted}
              onChange={handleChange}
              className="mt-0.5 rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-amber-500"
            />
            <span>I agree to the <span className="text-amber-400 underline">Privacy Policy</span></span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-400">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => setAuthView('login')}
          className="text-amber-400 hover:text-amber-300 font-semibold"
        >
          Login
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-center gap-2 text-[11px] text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Secure cryptographic hashing & GDPR compliant data storage</span>
      </div>
    </div>
  );
};
