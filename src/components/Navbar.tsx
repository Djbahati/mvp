import React from 'react';
import {
  Wallet,
  Smartphone,
  BookOpen,
  ArrowLeftRight,
  Building2,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  Sun,
  Moon,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { SystemServiceStatus, UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  services: SystemServiceStatus[];
  merkleRoot: string;
  userProfile: UserProfile;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenUssdModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  services,
  merkleRoot,
  userProfile,
  theme,
  onToggleTheme,
  onOpenUssdModal
}) => {
  const { currentUser, logout } = useAuth();

  const tabs = [
    { id: 'wallets', label: 'Wallets & Portfolio', icon: Wallet },
    { id: 'momo', label: 'Mobile Money (*951#)', icon: Smartphone },
    { id: 'ledger', label: 'Double-Entry Ledger', icon: BookOpen },
    { id: 'monitoring', label: 'Transaction Monitoring', icon: ShieldAlert },
    { id: 'exchange', label: 'FX & Swap', icon: ArrowLeftRight },
    { id: 'b2b', label: 'B2B & Merchants', icon: Building2 },
    { id: 'mining', label: 'Mining Telemetry', icon: Cpu },
    { id: 'compliance', label: 'KYC / AML Compliance', icon: ShieldCheck }
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      {/* Main header row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 text-black font-extrabold text-xl tracking-wider">
            K
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">KOFI</h1>
              <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-wide">
                Fintech Engine
              </span>
              <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700">
                USSD: *951#
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Multi-Currency Wallet • MoMo (*951#) • Double-Entry Ledger • B2B
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Current User Badge & Logout */}
          {currentUser && (
            <div className="hidden md:flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
              <UserIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-white">{currentUser.first_name}</span>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.2 rounded font-mono">{currentUser.role}</span>
            </div>
          )}

          {/* Theme Toggle Button (Dark Mode / High-Contrast Light Mode) */}
          <button
            id="theme-toggle-button"
            type="button"
            role="switch"
            aria-checked={theme === 'light'}
            aria-label={theme === 'light' ? 'Switch to Default Dark Mode' : 'Switch to High-Contrast Light Mode for Accessibility'}
            onClick={onToggleTheme}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-amber-500 ${
              theme === 'light'
                ? 'bg-amber-100 text-amber-950 border-amber-300 hover:bg-amber-200 shadow-sm'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white'
            }`}
            title={theme === 'light' ? 'High-Contrast Light Mode Active. Click to switch to Dark Mode' : 'Dark Mode Active. Click to switch to High-Contrast Light Mode'}
          >
            {theme === 'light' ? (
              <>
                <Sun className="w-4 h-4 text-amber-600" />
                <span className="font-bold">Light (A11y)</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-amber-400" />
                <span>Dark Mode</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenUssdModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 rounded-lg shadow-md shadow-emerald-500/15 transition-all cursor-pointer"
            title="Open USSD Handset Simulator (*951#)"
          >
            <Smartphone className="w-4 h-4" />
            <span>Launch *951# Phone</span>
          </button>

          <button
            onClick={() => logout()}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-all cursor-pointer"
            title="Log out of Kofi"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="border-t border-slate-800 bg-slate-950/60 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

