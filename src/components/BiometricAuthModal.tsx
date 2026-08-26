import React, { useState, useEffect } from 'react';
import {
  Fingerprint,
  ShieldCheck,
  X,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Key,
  ShieldAlert,
  Terminal,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Smartphone,
  Laptop
} from 'lucide-react';
import { HighRiskActionRequest, BiometricAssertionProof, BiometricCredential } from '../types';
import {
  authenticateWithBiometrics,
  getEnrolledPasskeys,
  registerBiometricPasskey,
  isPlatformAuthenticatorAvailable
} from '../services/webauthn';

interface BiometricAuthModalProps {
  actionRequest: HighRiskActionRequest | null;
  onClose: () => void;
  onEnrollSuccess?: (newPasskey: BiometricCredential) => void;
}

export const BiometricAuthModal: React.FC<BiometricAuthModalProps> = ({
  actionRequest,
  onClose,
  onEnrollSuccess
}) => {
  const [stage, setStage] = useState<'PROMPT' | 'SCANNING' | 'SUCCESS' | 'ERROR' | 'ENROLL'>('PROMPT');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [proof, setProof] = useState<BiometricAssertionProof | null>(null);
  const [showCryptoInspector, setShowCryptoInspector] = useState(false);
  const [enrolledPasskeys, setEnrolledPasskeys] = useState<BiometricCredential[]>([]);
  const [selectedPasskeyId, setSelectedPasskeyId] = useState<string>('');
  const [hasPlatformAuth, setHasPlatformAuth] = useState(true);

  // New Passkey Enrollment field
  const [enrollKeyName, setEnrollKeyName] = useState('My Device Passkey');

  useEffect(() => {
    if (actionRequest) {
      const keys = getEnrolledPasskeys();
      setEnrolledPasskeys(keys);
      if (keys.length > 0) {
        setSelectedPasskeyId(keys[0].id);
      }
      setStage('PROMPT');
      setProof(null);
      setErrorMessage(null);
      isPlatformAuthenticatorAvailable().then(setHasPlatformAuth);
    }
  }, [actionRequest]);

  if (!actionRequest) return null;

  const handleAuthenticate = async () => {
    setStage('SCANNING');
    setErrorMessage(null);

    try {
      // Simulate real-time biometric latency (e.g. 700ms sensor interaction)
      const [assertionResult] = await Promise.all([
        authenticateWithBiometrics(actionRequest.title, {
          amount: actionRequest.amount,
          asset: actionRequest.asset,
          destination: actionRequest.destination,
          riskScore: actionRequest.riskScore
        }),
        new Promise((resolve) => setTimeout(resolve, 850))
      ]);

      setProof(assertionResult);
      setStage('SUCCESS');

      // Auto-trigger completion after brief visual success state
      setTimeout(async () => {
        await actionRequest.onSuccess(assertionResult);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Biometric WebAuthn error:', err);
      setErrorMessage(err?.message || 'Biometric verification failed. Please try again.');
      setStage('ERROR');
    }
  };

  const handleEnrollNewPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    setStage('SCANNING');
    try {
      const newKey = await registerBiometricPasskey(
        'peter.bahati',
        'Peter Bahati',
        enrollKeyName || 'Touch ID / Face ID Secure Enclave'
      );
      setEnrolledPasskeys(getEnrolledPasskeys());
      setSelectedPasskeyId(newKey.id);
      if (onEnrollSuccess) onEnrollSuccess(newKey);
      setStage('PROMPT');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Passkey enrollment could not be completed.');
      setStage('ERROR');
    }
  };

  const selectedKey = enrolledPasskeys.find((k) => k.id === selectedPasskeyId) || enrolledPasskeys[0];

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle Radial Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            if (actionRequest.onCancel) actionRequest.onCancel();
            onClose();
          }}
          className="absolute right-4 top-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Fingerprint className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">WebAuthn Biometric Security Layer</h3>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30">
                FIDO2 / W3C Passkey
              </span>
            </div>
            <p className="text-xs text-slate-400">High-Assurance Cryptographic User Verification</p>
          </div>
        </div>

        {/* High-Risk Context Box */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Action Guard</span>
            <span className="flex items-center gap-1 text-amber-400 font-bold text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              <ShieldAlert className="w-3.5 h-3.5" />
              Risk Level: {actionRequest.riskScore}/100
            </span>
          </div>

          <div className="font-bold text-white text-sm">{actionRequest.title}</div>
          <p className="text-slate-400 text-[11px]">{actionRequest.description}</p>

          {actionRequest.amount !== undefined && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 font-mono">
              <span className="text-slate-400">Authorization Amount:</span>
              <span className="text-emerald-400 font-bold text-base">
                {actionRequest.amount.toLocaleString()} {actionRequest.asset || 'USD'}
              </span>
            </div>
          )}

          {actionRequest.destination && (
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Target Destination:</span>
              <span className="text-slate-300 truncate max-w-[200px]" title={actionRequest.destination}>
                {actionRequest.destination}
              </span>
            </div>
          )}
        </div>

        {/* STAGE: PROMPT */}
        {stage === 'PROMPT' && (
          <div className="space-y-5 text-center">
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative group cursor-pointer" onClick={handleAuthenticate}>
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-emerald-500/20 to-indigo-500/20 border-2 border-amber-500/40 flex items-center justify-center shadow-xl shadow-amber-500/10 transition-all transform group-hover:scale-105">
                  <Fingerprint className="w-12 h-12 text-amber-400 group-hover:text-amber-300 transition-colors" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 p-1.5 rounded-full shadow-lg">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm font-bold text-white">Touch ID / Face ID / Windows Hello</div>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Using registered platform authenticator:{' '}
                  <span className="text-amber-400 font-semibold font-mono">
                    {selectedKey ? selectedKey.name : 'MacBook Touch ID Enclave'}
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleAuthenticate}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Fingerprint className="w-4 h-4" />
                <span>Verify Biometrics & Sign Transaction</span>
              </button>

              <button
                type="button"
                onClick={() => setStage('ENROLL')}
                className="text-xs text-slate-400 hover:text-amber-400 transition-colors flex items-center justify-center gap-1 mx-auto pt-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Enroll a new Passkey / Hardware Key</span>
              </button>
            </div>
          </div>
        )}

        {/* STAGE: SCANNING */}
        {stage === 'SCANNING' && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-amber-500/10 border-2 border-amber-400 flex items-center justify-center animate-pulse">
                <Fingerprint className="w-12 h-12 text-amber-400 animate-bounce" />
              </div>
              <div className="absolute inset-0 rounded-3xl border-2 border-amber-500 animate-ping opacity-25" />
            </div>

            <div>
              <div className="text-base font-bold text-white flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>Awaiting Hardware Biometric Sensor...</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Scan your fingerprint (Touch ID) or Face ID to produce an ECDSA P-256 assertion signature.
              </p>
            </div>
          </div>
        )}

        {/* STAGE: SUCCESS */}
        {stage === 'SUCCESS' && (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20 animate-in zoom-in-90">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <div className="text-base font-bold text-emerald-400">WebAuthn Assertion Verified</div>
              <p className="text-xs text-slate-300 mt-0.5 font-mono">
                ECDSA P-256 Signature Valid • User Verification: PASSED
              </p>
            </div>

            {proof && (
              <div className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800 w-full text-left">
                <div>RP ID: <span className="text-slate-200">{proof.rpId}</span></div>
                <div className="truncate">Sig: <span className="text-amber-400">{proof.signatureHex.substring(0, 28)}...</span></div>
              </div>
            )}
          </div>
        )}

        {/* STAGE: ERROR */}
        {stage === 'ERROR' && (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <div className="text-sm font-bold text-rose-400">Biometric Verification Not Completed</div>
              <p className="text-xs text-slate-400 mt-1">{errorMessage}</p>
            </div>
            <button
              onClick={() => setStage('PROMPT')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* STAGE: ENROLL NEW PASSKEY */}
        {stage === 'ENROLL' && (
          <form onSubmit={handleEnrollNewPasskey} className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-sm">Enroll New WebAuthn Passkey</h4>
              <button
                type="button"
                onClick={() => setStage('PROMPT')}
                className="text-slate-400 hover:text-white"
              >
                Back
              </button>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Passkey / Device Name</label>
              <input
                type="text"
                value={enrollKeyName}
                onChange={(e) => setEnrollKeyName(e.target.value)}
                placeholder="e.g. MacBook Touch ID or iPhone Face ID"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ES256 (P-256 Curve) Hardware Keypair Generation</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Resident Credential with Biometric User Verification (UV=1)</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Register Passkey with Device
            </button>
          </form>
        )}

        {/* Cryptographic Inspector Drawer Toggle */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setShowCryptoInspector(!showCryptoInspector)}
            className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span className="flex items-center gap-1.5 font-mono">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              Cryptographic Enclave Details (W3C WebAuthn Proof)
            </span>
            {showCryptoInspector ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showCryptoInspector && (
            <div className="mt-3 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-400 space-y-2 animate-in fade-in">
              <div>
                <span className="text-slate-500">Algorithm:</span>{' '}
                <span className="text-amber-400">COSE -7 (ECDSA P-256 with SHA-256)</span>
              </div>
              <div>
                <span className="text-slate-500">User Verification Flags:</span>{' '}
                <span className="text-emerald-400">UP=1 (User Present), UV=1 (User Verified)</span>
              </div>
              <div>
                <span className="text-slate-500">Platform Authenticator:</span>{' '}
                <span className="text-slate-200">{selectedKey?.deviceType || 'Apple Secure Enclave'}</span>
              </div>
              <div>
                <span className="text-slate-500">Origin Binding:</span>{' '}
                <span className="text-slate-200">{typeof window !== 'undefined' ? window.location.origin : 'https://kofi.network'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
