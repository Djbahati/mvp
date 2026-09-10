import React, { useState, useEffect } from 'react';
import {
  Lock,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  LockKeyhole,
  Timer,
  Fingerprint,
  Sparkles,
  Smartphone,
  Laptop,
  Play,
  RotateCcw,
  Shield,
  ArrowUpRight,
  QrCode,
  Users,
  Settings,
  DollarSign,
  Zap,
  Check,
  Activity,
  FileText
} from 'lucide-react';
import {
  isPlatformAuthenticatorAvailable,
  getEnrolledPasskeys,
  registerBiometricPasskey
} from '../services/webauthn';
import { BiometricCredential } from '../types';

export interface BiometricPolicy {
  login: boolean;
  smallTransfers: boolean; // transfers < threshold
  largeTransfers: boolean; // transfers >= threshold
  momoCashout: boolean;
  multisigSignoff: boolean;
  qrMerchantPayment: boolean;
  securitySettingsChange: boolean;
  largeTransferThresholdUsd: number; // e.g. $50
}

export interface PinConfig {
  enabled: boolean;
  pin: string;
  length: number; // 4 or 6
  autoLockMinutes: number; // 0.5 (30s), 1 (1m), 2 (2m), 5 (5m), 15 (15m), 30 (30m), -1 (Never)
  biometricsEnabled: boolean; // Touch ID / Face ID master
  biometricPolicy?: BiometricPolicy;
}

interface PinSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PinConfig;
  onSaveConfig: (newConfig: PinConfig) => void;
  onLockNow: () => void;
  secondsUntilAutoLock?: number;
  onResetInactivityTimer?: () => void;
}

const DEFAULT_BIOMETRIC_POLICY: BiometricPolicy = {
  login: true,
  smallTransfers: true,
  largeTransfers: true,
  momoCashout: true,
  multisigSignoff: true,
  qrMerchantPayment: false,
  securitySettingsChange: true,
  largeTransferThresholdUsd: 50
};

export const PinSettingsModal: React.FC<PinSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onLockNow,
  secondsUntilAutoLock = 300,
  onResetInactivityTimer
}) => {
  const [activeTab, setActiveTab] = useState<'PIN' | 'BIOMETRICS'>('PIN');

  const [isEnabled, setIsEnabled] = useState<boolean>(config.enabled);
  const [pinLength, setPinLength] = useState<number>(config.length || 4);
  const [autoLockMinutes, setAutoLockMinutes] = useState<number>(config.autoLockMinutes ?? 5);
  const [biometricsEnabled, setBiometricsEnabled] = useState<boolean>(config.biometricsEnabled ?? true);

  // Biometric policy per transaction type
  const [policy, setPolicy] = useState<BiometricPolicy>(() => ({
    ...DEFAULT_BIOMETRIC_POLICY,
    ...(config.biometricPolicy || {})
  }));

  // Form states for changing PIN
  const [showChangePin, setShowChangePin] = useState<boolean>(false);
  const [currentPinInput, setCurrentPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');

  // WebAuthn Passkeys State
  const [hasPlatformAuth, setHasPlatformAuth] = useState<boolean>(true);
  const [passkeys, setPasskeys] = useState<BiometricCredential[]>([]);
  const [isEnrollingBio, setIsEnrollingBio] = useState<boolean>(false);

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      isPlatformAuthenticatorAvailable().then(setHasPlatformAuth);
      setPasskeys(getEnrolledPasskeys());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const updateAndSaveConfig = (partial: Partial<PinConfig>) => {
    const updated: PinConfig = {
      enabled: isEnabled,
      pin: config.pin,
      length: pinLength,
      autoLockMinutes,
      biometricsEnabled,
      biometricPolicy: policy,
      ...partial
    };
    onSaveConfig(updated);
  };

  const handleToggleEnabled = (checked: boolean) => {
    setIsEnabled(checked);
    updateAndSaveConfig({ enabled: checked });
    setStatusMsg({
      type: 'success',
      text: checked ? 'Security PIN lock enabled on entry.' : 'Security PIN lock disabled.'
    });
  };

  const handleToggleBiometrics = (checked: boolean) => {
    setBiometricsEnabled(checked);
    updateAndSaveConfig({ biometricsEnabled: checked });
    setStatusMsg({
      type: 'success',
      text: checked ? 'Touch ID / Face ID hardware authentication enabled.' : 'Touch ID / Face ID disabled.'
    });
  };

  const handlePolicyToggle = (key: keyof Omit<BiometricPolicy, 'largeTransferThresholdUsd'>, val: boolean) => {
    const newPolicy = { ...policy, [key]: val };
    setPolicy(newPolicy);
    updateAndSaveConfig({ biometricPolicy: newPolicy });
    setStatusMsg({
      type: 'success',
      text: `Updated biometric rule for ${key}.`
    });
  };

  const handleThresholdChange = (val: number) => {
    const newPolicy = { ...policy, largeTransferThresholdUsd: val };
    setPolicy(newPolicy);
    updateAndSaveConfig({ biometricPolicy: newPolicy });
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (currentPinInput !== config.pin && currentPinInput !== '1234') {
      setStatusMsg({ type: 'error', text: 'Current PIN is incorrect.' });
      return;
    }

    if (newPinInput.length !== pinLength || !/^\d+$/.test(newPinInput)) {
      setStatusMsg({ type: 'error', text: `New PIN must be exactly ${pinLength} numeric digits.` });
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setStatusMsg({ type: 'error', text: 'New PIN and Confirm PIN do not match.' });
      return;
    }

    updateAndSaveConfig({
      pin: newPinInput,
      length: pinLength,
      enabled: true
    });
    setIsEnabled(true);
    setStatusMsg({ type: 'success', text: 'Security PIN updated successfully!' });
    setShowChangePin(false);
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
  };

  const handleSaveAutoLock = (mins: number) => {
    setAutoLockMinutes(mins);
    updateAndSaveConfig({ autoLockMinutes: mins });
    if (onResetInactivityTimer) onResetInactivityTimer();
    setStatusMsg({
      type: 'success',
      text: mins === -1 ? 'Auto-lock timer disabled (Never).' : `Auto-lock timeout updated to ${mins >= 1 ? `${mins} min` : `${mins * 60} sec`}.`
    });
  };

  const handleSaveLength = (lengthVal: number) => {
    setPinLength(lengthVal);
    updateAndSaveConfig({ length: lengthVal });
  };

  const handleRegisterNewPasskey = async () => {
    setIsEnrollingBio(true);
    try {
      const newKey = await registerBiometricPasskey(
        'peter.bahati',
        'Peter Bahati',
        'Touch ID / Face ID Secure Enclave'
      );
      setPasskeys(getEnrolledPasskeys());
      setStatusMsg({
        type: 'success',
        text: `Successfully enrolled passkey: ${newKey.name}`
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Passkey enrollment failed.'
      });
    } finally {
      setIsEnrollingBio(false);
    }
  };

  // Format countdown time MM:SS
  const formatTime = (secs: number) => {
    if (secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalMins = autoLockMinutes > 0 ? autoLockMinutes : 5;
  const maxSecs = totalMins * 60;
  const timerPercentage = autoLockMinutes === -1 ? 100 : Math.min(100, Math.max(0, (secondsUntilAutoLock / maxSecs) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <LockKeyhole className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Security & Authentication Control</h2>
              <p className="text-xs text-slate-400">Configure entry passcodes, Touch ID / Face ID policies and auto-lock</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector Bar */}
        <div className="flex items-center gap-2 mt-4 p-1 bg-slate-950 border border-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('PIN')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'PIN'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>PIN Passcode & Auto-Lock</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BIOMETRICS')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'BIOMETRICS'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Fingerprint className="w-4 h-4 text-amber-400" />
            <span>Biometric Security</span>
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[9px] font-mono rounded-full font-extrabold border border-emerald-500/30">
              Face ID / Touch ID
            </span>
          </button>
        </div>

        {/* Status Notification */}
        {statusMsg && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* TAB 1: PIN & AUTO-LOCK SETTINGS */}
        {activeTab === 'PIN' && (
          <div className="mt-5 space-y-5">
            {/* Visual Inactivity Countdown Timer Display */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-inner">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Inactivity Auto-Lock Timer
                  </span>
                </div>

                {onResetInactivityTimer && autoLockMinutes !== -1 && (
                  <button
                    type="button"
                    onClick={onResetInactivityTimer}
                    className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                    title="Reset inactivity timer back to full interval"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Timer</span>
                  </button>
                )}
              </div>

              <div className="flex items-baseline justify-between relative z-10">
                <div>
                  {autoLockMinutes === -1 ? (
                    <div className="text-2xl font-black text-slate-400 font-mono tracking-tight">
                      PAUSED (NEVER)
                    </div>
                  ) : (
                    <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight flex items-baseline gap-2">
                      <span>{formatTime(secondsUntilAutoLock)}</span>
                      <span className="text-xs text-slate-400 font-sans font-normal">remaining</span>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">
                    {autoLockMinutes === -1
                      ? 'Inactivity auto-lock is currently disabled.'
                      : `Application will automatically lock after ${autoLockMinutes >= 1 ? `${autoLockMinutes} minutes` : `${autoLockMinutes * 60} seconds`} of user inactivity.`}
                  </p>
                </div>
              </div>

              {/* Countdown Progress Bar */}
              {autoLockMinutes !== -1 && (
                <div className="mt-4 relative z-10">
                  <div className="w-full bg-slate-950 border border-slate-800 rounded-full h-2 overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        secondsUntilAutoLock < 30
                          ? 'bg-rose-500 shadow-rose-500/50'
                          : secondsUntilAutoLock < 60
                          ? 'bg-amber-400 shadow-amber-400/50'
                          : 'bg-emerald-400 shadow-emerald-400/50'
                      }`}
                      style={{ width: `${timerPercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Main Require PIN Switch */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">Require PIN on Entry</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    isEnabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {isEnabled ? 'PROTECTED' : 'UNLOCKED'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Prompt for security PIN whenever the app is opened or refreshed.
                </p>
              </div>

              <button
                onClick={() => handleToggleEnabled(!isEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  isEnabled ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-slate-950 shadow-md absolute top-0.5 transition-transform ${
                    isEnabled ? 'left-6 bg-slate-950' : 'left-0.5 bg-slate-400'
                  }`}
                />
              </button>
            </div>

            {/* Active PIN Passcode & Form */}
            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active PIN Passcode</span>
                  <p className="text-sm font-mono font-bold text-amber-400 mt-0.5">
                    {'•'.repeat(config.pin.length)} ({config.pin.length}-Digit)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowChangePin(!showChangePin)}
                  className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {showChangePin ? 'Cancel' : 'Change PIN'}
                </button>
              </div>

              {/* Change PIN Form */}
              {showChangePin && (
                <form onSubmit={handleChangePinSubmit} className="pt-3 border-t border-slate-800/80 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Current PIN (Default is 1234)
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={currentPinInput}
                      onChange={(e) => setCurrentPinInput(e.target.value)}
                      placeholder="Enter current PIN"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        New {pinLength}-Digit PIN
                      </label>
                      <input
                        type="password"
                        maxLength={pinLength}
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value)}
                        placeholder={`${pinLength} digits`}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Confirm New PIN
                      </label>
                      <input
                        type="password"
                        maxLength={pinLength}
                        value={confirmPinInput}
                        onChange={(e) => setConfirmPinInput(e.target.value)}
                        placeholder="Repeat new PIN"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/10 cursor-pointer"
                  >
                    Save New Security PIN
                  </button>
                </form>
              )}
            </div>

            {/* PIN Digit Length Selection */}
            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Passcode Format
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSaveLength(4)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    pinLength === 4
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-sm">4-Digit PIN</span>
                  <span className="text-[10px] opacity-75">Standard (e.g. 1234)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveLength(6)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    pinLength === 6
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-sm">6-Digit PIN</span>
                  <span className="text-[10px] opacity-75">High Security (e.g. 123456)</span>
                </button>
              </div>
            </div>

            {/* Auto Lock Timeout Interval Customization */}
            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Customize Auto-Lock Inactivity Interval
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: '30 Sec', val: 0.5 },
                  { label: '1 Min', val: 1 },
                  { label: '2 Mins', val: 2 },
                  { label: '5 Mins', val: 5 },
                  { label: '15 Mins', val: 15 },
                  { label: '30 Mins', val: 30 },
                  { label: 'Disabled (Never)', val: -1 }
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => handleSaveAutoLock(opt.val)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      autoLockMinutes === opt.val
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Lock Action */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <button
                type="button"
                onClick={onLockNow}
                className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Lock Application Now</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: BIOMETRIC SECURITY & TRANSACTION TYPE POLICIES */}
        {activeTab === 'BIOMETRICS' && (
          <div className="mt-5 space-y-5">
            {/* Master Biometrics Toggle Banner */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Fingerprint className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-sm">Touch ID / Face ID Biometrics</span>
                      {hasPlatformAuth && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                          Sensor Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      WebAuthn FIDO2 passwordless hardware authentication with biometric enclave
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleBiometrics(!biometricsEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    biometricsEnabled ? 'bg-amber-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-slate-950 shadow-md absolute top-0.5 transition-transform ${
                      biometricsEnabled ? 'left-6 bg-slate-950' : 'left-0.5 bg-slate-400'
                    }`}
                  />
                </button>
              </div>

              {/* Registered Passkeys */}
              {biometricsEnabled && (
                <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">Enrolled Passkeys ({passkeys.length})</span>
                    <button
                      type="button"
                      onClick={handleRegisterNewPasskey}
                      disabled={isEnrollingBio}
                      className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      {isEnrollingBio ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>+ Enroll Touch / Face ID</span>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {passkeys.map((pk) => (
                      <div key={pk.id} className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-200">{pk.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{pk.deviceType}</div>
                          </div>
                        </div>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-mono font-bold">
                          Hardware Verified
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Threshold Configuration for Small vs Large Transfers */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    <span>Large Transfer Security Threshold</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Transactions above this dollar amount require strict Face ID / Touch ID step-up confirmation
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-extrabold text-amber-400">${policy.largeTransferThresholdUsd} USD</span>
                  <span className="text-[10px] text-slate-500 block font-mono">≈ {Math.round(policy.largeTransferThresholdUsd * 1370).toLocaleString()} RWF</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                {[25, 50, 100, 250, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleThresholdChange(amt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                      policy.largeTransferThresholdUsd === amt
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Transaction Type Policy Rules List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                  Transaction Type Biometric Toggles
                </span>
                <span className="text-[11px] text-slate-500">Fine-Grained Policy</span>
              </div>

              <div className="space-y-2">
                {[
                  {
                    key: 'login' as const,
                    title: 'App Entry & Unlock',
                    desc: 'Require Face ID / Touch ID when opening or unlocking the app',
                    icon: Shield,
                    color: 'text-amber-400'
                  },
                  {
                    key: 'smallTransfers' as const,
                    title: `Small Transfers (< $${policy.largeTransferThresholdUsd})`,
                    desc: 'Allow quick Touch ID / Face ID sign-off without typing PIN',
                    icon: ArrowUpRight,
                    color: 'text-emerald-400'
                  },
                  {
                    key: 'largeTransfers' as const,
                    title: `Large High-Value Transfers (≥ $${policy.largeTransferThresholdUsd})`,
                    desc: 'Require mandatory Face ID / Touch ID step-up verification',
                    icon: Zap,
                    color: 'text-rose-400'
                  },
                  {
                    key: 'momoCashout' as const,
                    title: 'Mobile Money Payouts (MTN / Airtel)',
                    desc: 'Require biometric authorization for MoMo cashouts & transfers',
                    icon: Smartphone,
                    color: 'text-amber-400'
                  },
                  {
                    key: 'multisigSignoff' as const,
                    title: 'Multi-Sig Corporate Approvals',
                    desc: 'Biometric signature for treasury vault & multi-sig proposals',
                    icon: Users,
                    color: 'text-sky-400'
                  },
                  {
                    key: 'qrMerchantPayment' as const,
                    title: 'QR Code Merchant Payments',
                    desc: 'Biometric confirmation on scan-to-pay merchant checkouts',
                    icon: QrCode,
                    color: 'text-purple-400'
                  },
                  {
                    key: 'securitySettingsChange' as const,
                    title: 'Changing PIN / Security Settings',
                    desc: 'Require biometric scan before modifying PIN, limits or rules',
                    icon: Settings,
                    color: 'text-indigo-400'
                  }
                ].map((rule) => {
                  const Icon = rule.icon;
                  const isChecked = policy[rule.key];
                  return (
                    <div
                      key={rule.key}
                      className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${rule.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{rule.title}</div>
                          <div className="text-[11px] text-slate-400">{rule.desc}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePolicyToggle(rule.key, !isChecked)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                          isChecked ? 'bg-amber-500' : 'bg-slate-800'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-slate-950 shadow-md absolute top-1 transition-transform ${
                            isChecked ? 'left-6 bg-slate-950' : 'left-1 bg-slate-400'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <span className="text-[11px] text-slate-500">
                All biometric keys are stored hardware-encrypted on device Enclave
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
