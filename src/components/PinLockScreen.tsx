import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Delete, Key, AlertCircle, CheckCircle2, RefreshCw, Fingerprint, Sparkles } from 'lucide-react';
import { authenticateWithBiometrics, isPlatformAuthenticatorAvailable } from '../services/webauthn';

interface PinLockScreenProps {
  storedPin: string;
  pinLength: number;
  onUnlock: () => void;
  onResetPinToDefault?: () => void;
  biometricsEnabled?: boolean;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  storedPin,
  pinLength = 4,
  onUnlock,
  onResetPinToDefault,
  biometricsEnabled = true
}) => {
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [masterKeyInput, setMasterKeyInput] = useState<string>('');
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  // Biometric auth state
  const [hasBiometrics, setHasBiometrics] = useState<boolean>(false);
  const [isBioScanning, setIsBioScanning] = useState<boolean>(false);

  useEffect(() => {
    isPlatformAuthenticatorAvailable().then(setHasBiometrics);
  }, []);

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enteredPin, pinLength]);

  const handleDigitPress = (digit: string) => {
    if (enteredPin.length >= pinLength) return;
    const nextPin = enteredPin + digit;
    setEnteredPin(nextPin);
    setErrorMsg('');

    if (nextPin.length === pinLength) {
      verifyPin(nextPin);
    }
  };

  const handleDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setEnteredPin('');
    setErrorMsg('');
  };

  const verifyPin = (pinToTest: string) => {
    if (pinToTest === storedPin) {
      setErrorMsg('');
      onUnlock();
    } else {
      setIsShaking(true);
      setErrorMsg('Incorrect Security PIN. Please try again.');
      setTimeout(() => {
        setIsShaking(false);
        setEnteredPin('');
      }, 500);
    }
  };

  const handleBiometricUnlock = async () => {
    setIsBioScanning(true);
    setErrorMsg('');

    try {
      const [proof] = await Promise.all([
        authenticateWithBiometrics('Dashboard Access Unlock', {}),
        new Promise((resolve) => setTimeout(resolve, 600))
      ]);

      if (proof && proof.userVerified) {
        onUnlock();
      }
    } catch (err: any) {
      setErrorMsg('Biometric verification failed. Use numeric PIN.');
    } finally {
      setIsBioScanning(false);
    }
  };

  const handleMasterKeyReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterKeyInput.trim() === '1234' || masterKeyInput.trim() === '9510') {
      if (onResetPinToDefault) onResetPinToDefault();
      setResetSuccess(true);
      setTimeout(() => {
        setShowForgotModal(false);
        setResetSuccess(false);
        setEnteredPin('');
        setMasterKeyInput('');
        onUnlock();
      }, 1200);
    } else {
      setErrorMsg('Invalid Master Key! Use default key 1234 or 9510.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className={`w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all ${
          isShaking ? 'animate-shake border-rose-500/50' : ''
        }`}
      >
        {/* Background Ambient Lights */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Logo & Shield Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 text-black font-black text-2xl mb-4">
            <Lock className="w-8 h-8 text-slate-950" />
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">KOFI Security Pass</h2>
          <p className="text-xs text-slate-400 mt-1">Enter your {pinLength}-digit PIN to access your multi-currency wallet</p>

          {/* Default PIN Hint Badge */}
          <div className="mt-3 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <Key className="w-3 h-3 text-amber-400" />
            <span>Default PIN: <strong className="text-amber-400 font-bold">1234</strong></span>
          </div>

          {/* Touch ID / Face ID Quick Action Banner */}
          {biometricsEnabled && (
            <div className="w-full mt-4">
              <button
                type="button"
                onClick={handleBiometricUnlock}
                disabled={isBioScanning}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-indigo-500/15 hover:from-amber-500/25 border border-amber-500/30 rounded-2xl text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-500/10"
              >
                {isBioScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Scanning Touch ID / Face ID...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4 text-amber-400" />
                    <span>Unlock with Touch ID / Face ID</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* PIN Bullet Dots */}
          <div className="flex items-center gap-3 my-5">
            {Array.from({ length: pinLength }).map((_, idx) => {
              const isFilled = idx < enteredPin.length;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    isFilled
                      ? 'bg-amber-400 border-amber-400 scale-110 shadow-lg shadow-amber-400/30'
                      : 'border-slate-700 bg-slate-950'
                  }`}
                />
              );
            })}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[260px] my-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleDigitPress(num)}
                className="w-full h-14 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 text-white font-bold text-lg flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              className="w-full h-14 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white font-semibold text-xs flex items-center justify-center transition-all cursor-pointer active:scale-95"
            >
              CLEAR
            </button>

            <button
              type="button"
              onClick={() => handleDigitPress('0')}
              className="w-full h-14 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 text-white font-bold text-lg flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="w-full h-14 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 font-semibold text-xs flex items-center justify-center transition-all cursor-pointer active:scale-95"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions Footer */}
          <div className="mt-5 flex items-center justify-between w-full text-xs text-slate-400 border-t border-slate-800/80 pt-4">
            <button
              type="button"
              onClick={() => verifyPin('1234')}
              className="text-amber-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Use Default (1234)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              Forgot PIN?
            </button>
          </div>
        </div>
      </div>

      {/* Forgot PIN / Master Reset Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              Reset Security PIN
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter master recovery key <strong className="text-white">1234</strong> or <strong className="text-white">9510</strong> to reset your PIN back to factory default.
            </p>

            {resetSuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>PIN Reset to Default (1234). Unlocking...</span>
              </div>
            ) : (
              <form onSubmit={handleMasterKeyReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Master Recovery Key
                  </label>
                  <input
                    type="password"
                    value={masterKeyInput}
                    onChange={(e) => setMasterKeyInput(e.target.value)}
                    placeholder="Enter 1234 or 9510"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                    autoFocus
                  />
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all cursor-pointer"
                  >
                    Reset & Unlock
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

