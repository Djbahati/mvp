import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  LockKeyhole,
  Lock,
  Calendar,
  Coins
} from 'lucide-react';
import { SystemServiceStatus, UserProfile } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  services: SystemServiceStatus[];
  merkleRoot: string;
  userProfile: UserProfile;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenUssdModal: () => void;
  onOpenPinSettings?: () => void;
  isPinProtected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  services,
  merkleRoot,
  userProfile,
  theme,
  onToggleTheme,
  onOpenUssdModal,
  onOpenPinSettings,
  isPinProtected = true
}) => {
  const tabs = [
    { id: 'wallets', label: 'Wallets & Portfolio', icon: Wallet },
    { id: 'momo', label: 'Mobile Money (*951#)', icon: Smartphone },
    { id: 'ledger', label: 'Double-Entry Ledger', icon: BookOpen },
    { id: 'monitoring', label: 'Transaction Monitoring', icon: ShieldAlert },
    { id: 'exchange', label: 'FX & Swap', icon: ArrowLeftRight },
    { id: 'converter', label: 'Currency Converter', icon: Coins },
    { id: 'b2b', label: 'B2B & Merchants', icon: Building2 },
    { id: 'calendar', label: 'Google Calendar', icon: Calendar },
    { id: 'mining', label: 'Mining Telemetry', icon: Cpu },
    { id: 'compliance', label: 'KYC / AML Compliance', icon: ShieldCheck },
    { id: 'security', label: 'Security Logs', icon: Lock }
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
          {/* Security PIN Config Button */}
          {onOpenPinSettings && (
            <button
              onClick={onOpenPinSettings}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                isPinProtected
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
              title="Configure Security PIN Lock & Passcode Settings"
            >
              <LockKeyhole className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Security PIN</span>
            </button>
          )}

          {/* Smooth Animated Theme Toggle Switch */}
          <button
            id="theme-toggle-button"
            type="button"
            role="switch"
            aria-checked={theme === 'light'}
            aria-label={theme === 'light' ? 'Switch to Default Dark Mode' : 'Switch to High-Contrast Light Mode for Accessibility'}
            onClick={onToggleTheme}
            className={`relative flex items-center justify-between w-20 sm:w-28 h-8 p-1 rounded-xl border transition-colors duration-300 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-amber-500 ${
              theme === 'light'
                ? 'bg-amber-100 border-amber-300 shadow-inner'
                : 'bg-slate-800 border-slate-700'
            }`}
            title={theme === 'light' ? 'High-Contrast Light Mode Active. Click to switch to Dark Mode' : 'Dark Mode Active. Click to switch to High-Contrast Light Mode'}
          >
            {/* Sliding Knob */}
            <motion.div
              className={`absolute top-1 bottom-1 w-7 sm:w-12 rounded-lg flex items-center justify-center shadow-md ${
                theme === 'light'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-amber-400 border border-slate-700'
              }`}
              animate={{
                x: theme === 'light' ? (typeof window !== 'undefined' && window.innerWidth < 640 ? 44 : 52) : 0
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  {theme === 'light' ? (
                    <Sun className="w-3.5 h-3.5 text-slate-950" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.div>

            {/* Background Labels */}
            <span
              className={`text-[10px] font-bold px-1.5 transition-opacity duration-200 ${
                theme === 'light' ? 'opacity-0' : 'text-slate-400 ml-auto'
              }`}
            >
              Dark
            </span>
            <span
              className={`text-[10px] font-extrabold px-1.5 transition-opacity duration-200 ${
                theme === 'light' ? 'text-amber-950 mr-auto' : 'opacity-0'
              }`}
            >
              Light
            </span>
          </button>

          <button
            onClick={onOpenUssdModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 rounded-lg shadow-md shadow-emerald-500/15 transition-all cursor-pointer"
            title="Open USSD Handset Simulator (*951#)"
          >
            <Smartphone className="w-4 h-4" />
            <span>Launch *951# Phone</span>
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

