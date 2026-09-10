import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Fingerprint,
  CheckCircle2,
  AlertTriangle,
  Key,
  Lock,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  Database,
  Smartphone,
  Cpu,
  Clock,
  Shield
} from 'lucide-react';
import { SecurityLog } from '../types';

interface SecurityLogsViewProps {
  logs: SecurityLog[];
  onClearLogs?: () => void;
  onSimulateTestAuth?: () => void;
}

export const SecurityLogsView: React.FC<SecurityLogsViewProps> = ({
  logs,
  onClearLogs,
  onSimulateTestAuth
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');
  const [selectedEventType, setSelectedEventType] = useState<string>('ALL');

  const filteredLogs = logs.filter((log) => {
    const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;
    const matchesEvent = selectedEventType === 'ALL' || log.event_type === selectedEventType;
    const matchesSearch =
      log.action_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.authenticator_name && log.authenticator_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.ip_address && log.ip_address.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesEvent && matchesSearch;
  });

  const totalEvents = logs.length;
  const successCount = logs.filter((l) => l.status === 'SUCCESS').length;
  const failedCount = logs.filter((l) => l.status === 'FAILED').length;
  const passkeyCount = logs.filter((l) => l.event_type === 'PASSKEY_ENROLLED').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">Security Audit Logs & Passkey History</h2>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>Encrypted Local Vault</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Comprehensive WebAuthn biometric assertion audit trail, platform passkey enrollments, and step-up authentication logs audited by FIDO2 enclave rules.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onSimulateTestAuth && (
              <button
                onClick={onSimulateTestAuth}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Fingerprint className="w-4 h-4" />
                <span>Test Biometric Verification</span>
              </button>
            )}

            {onClearLogs && logs.length > 0 && (
              <button
                onClick={onClearLogs}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Clear History</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400 block">Total Logged Events</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{totalEvents}</span>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400 block">Verified Biometrics</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">{successCount}</span>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400 block">Blocked / Failed Attempts</span>
            <span className="text-2xl font-black text-rose-400 font-mono mt-1 block">{failedCount}</span>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400 block">Active Device Passkeys</span>
            <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">{passkeyCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs, devices, IPs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>

            {(['ALL', 'SUCCESS', 'FAILED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                  selectedStatus === status
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {status === 'ALL' ? 'All Status' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Log Entries List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Audit Trail Activity Log ({filteredLogs.length})</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">FIDO2 ECDSA P-256 Signatures</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No Security Logs Found</p>
            <p className="text-xs max-w-sm mx-auto text-slate-500">
              Biometric verification attempts and passkey events will be recorded here automatically when performed.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredLogs.map((log) => {
              const isSuccess = log.status === 'SUCCESS';
              return (
                <div key={log.id} className="p-4 hover:bg-slate-850/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl mt-0.5 ${
                        isSuccess
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">{log.action_title}</span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                            isSuccess
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {log.event_type.replace('_', ' ')}
                        </span>
                        {log.risk_score !== undefined && (
                          <span className="text-[10px] font-mono bg-slate-950 text-amber-400 px-2 py-0.5 rounded border border-slate-800">
                            Risk: {log.risk_score}/100
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                        {log.authenticator_name && (
                          <span className="flex items-center gap-1 font-mono text-slate-300">
                            <Key className="w-3 h-3 text-amber-400" />
                            {log.authenticator_name}
                          </span>
                        )}
                        {log.ip_address && (
                          <span className="font-mono text-slate-500">
                            IP: {log.ip_address}
                          </span>
                        )}
                        {log.device_info && (
                          <span className="font-mono text-slate-500">
                            Device: {log.device_info}
                          </span>
                        )}
                      </div>

                      {log.error_message && (
                        <p className="text-xs text-rose-400 font-mono mt-1.5 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                          Failure Reason: {log.error_message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right md:min-w-[150px]">
                    <span className="text-xs text-slate-400 font-mono block">
                      {new Date(log.timestamp).toLocaleDateString()}{' '}
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mt-0.5 font-semibold">
                      {isSuccess ? 'WebAuthn Verified' : 'Access Denied'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
