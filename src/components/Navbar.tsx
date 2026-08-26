import React from 'react';
import {
  Wallet,
  Smartphone,
  BookOpen,
  ArrowLeftRight,
  Building2,
  Cpu,
  ShieldCheck,
  Terminal,
  Download,
  Code2,
  CheckCircle2,
  Layers,
  PhoneCall,
  Zap
} from 'lucide-react';
import { SystemServiceStatus, UserProfile } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  services: SystemServiceStatus[];
  merkleRoot: string;
  userProfile: UserProfile;
  onOpenUssdModal: () => void;
  onOpenCodeInspector: () => void;
  onDownloadZip: () => void;
  isDownloading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  services,
  merkleRoot,
  userProfile,
  onOpenUssdModal,
  onOpenCodeInspector,
  onDownloadZip,
  isDownloading
}) => {
  const tabs = [
    { id: 'wallets', label: 'Wallets & Portfolio', icon: Wallet },
    { id: 'momo', label: 'Mobile Money (*951#)', icon: Smartphone },
    { id: 'ledger', label: 'Double-Entry Ledger', icon: BookOpen },
    { id: 'exchange', label: 'FX & Swap', icon: ArrowLeftRight },
    { id: 'b2b', label: 'B2B & Merchants', icon: Building2 },
    { id: 'mining', label: 'Mining Telemetry', icon: Cpu },
    { id: 'compliance', label: 'KYC / AML Compliance', icon: ShieldCheck },
    { id: 'api', label: 'API Sandbox', icon: Terminal }
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      {/* Top microservice status bar */}
      <div className="bg-slate-950/80 px-4 py-1.5 border-b border-slate-800/60 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            Polyglot Mesh:
          </span>
          {services.map((svc) => (
            <div
              key={svc.name}
              className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded text-[11px]"
              title={`${svc.role} (Port ${svc.port})`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-200">{svc.name}</span>
              <span className="text-slate-400">({svc.language})</span>
              <span className="text-emerald-400 font-mono">{svc.latency_ms}ms</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          {/* USSD *951# Live Connection Status */}
          <button
            onClick={onOpenUssdModal}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded border transition-all cursor-pointer font-mono ${
              userProfile.is_phone_linked
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20 animate-pulse'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span className="font-bold">*951# USSD:</span>
            <span>
              {userProfile.is_phone_linked
                ? `Linked (+250 ${userProfile.phone_number})`
                : 'Connect Phone'}
            </span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-0.5 rounded border border-slate-800 font-mono text-slate-300">
            <span className="text-amber-400 font-semibold">Merkle Root:</span>
            <span className="text-slate-400 truncate max-w-[120px]" title={merkleRoot}>
              {merkleRoot.substring(0, 10)}...{merkleRoot.substring(merkleRoot.length - 6)}
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
          </div>
          <span className="text-slate-400 hidden lg:inline">
            HSM / MPC Enclave: <span className="text-emerald-400 font-medium">Active</span>
          </span>
        </div>
      </div>

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
          <button
            onClick={onOpenUssdModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 rounded-lg shadow-md shadow-emerald-500/15 transition-all cursor-pointer"
            title="Open USSD Handset Simulator (*951#)"
          >
            <Smartphone className="w-4 h-4" />
            <span>Launch *951# Phone</span>
          </button>

          <button
            onClick={onOpenCodeInspector}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            title="Inspect full Rust, Go, C#, Java & SQL source code"
          >
            <Code2 className="w-4 h-4 text-amber-400" />
            <span>Inspect Stack</span>
          </button>

          <button
            onClick={onDownloadZip}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-md shadow-amber-500/10 transition-all cursor-pointer disabled:opacity-50"
            title="Download full project repository as .ZIP"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'Bundling ZIP...' : 'Download (.ZIP)'}</span>
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
