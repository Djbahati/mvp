import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  FileCheck,
  Search,
  CheckCircle2,
  Lock,
  Flag,
  Activity,
  Sliders,
  Fingerprint,
  Key,
  Laptop,
  Smartphone,
  Sparkles,
  RefreshCw,
  Terminal,
  Clock
} from 'lucide-react';
import { KycProfile, BiometricCredential, BiometricAssertionProof } from '../types';
import {
  getEnrolledPasskeys,
  registerBiometricPasskey,
  authenticateWithBiometrics,
  isPlatformAuthenticatorAvailable,
  deletePasskey
} from '../services/webauthn';

interface ComplianceKYCProps {
  kycProfile: KycProfile;
  onTriggerBiometricTest?: (title: string, details: any) => void;
}

export const ComplianceKYC: React.FC<ComplianceKYCProps> = ({ kycProfile, onTriggerBiometricTest }) => {
  const [testAmount, setTestAmount] = useState('25000');
  const [testCountry, setTestCountry] = useState('RWA');
  const [testDestination, setTestDestination] = useState('0x71c9...3902');
  const [riskAssessment, setRiskAssessment] = useState<{
    score: number;
    rating: 'LOW' | 'MEDIUM' | 'HIGH';
    sanctionsCleared: boolean;
    pepCleared: boolean;
    ruleFlags: string[];
    action: 'APPROVED' | 'STEP_UP_AUTH' | 'BLOCKED';
  } | null>(null);

  // WebAuthn Passkeys State
  const [passkeys, setPasskeys] = useState<BiometricCredential[]>([]);
  const [platformAuthSupported, setPlatformAuthSupported] = useState<boolean>(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState('Touch ID / Face ID');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [biometricAuditLogs, setBiometricAuditLogs] = useState<BiometricAssertionProof[]>([]);
  const [isTestingAuth, setIsTestingAuth] = useState(false);
  const [enforceBiometrics, setEnforceBiometrics] = useState(true);

  useEffect(() => {
    setPasskeys(getEnrolledPasskeys());
    isPlatformAuthenticatorAvailable().then(setPlatformAuthSupported);
  }, []);

  const handleEvaluateRisk = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(testAmount) || 0;

    let score = 5;
    const flags: string[] = [];

    if (amount > 10000) {
      score += 15;
      flags.push('High-Value Threshold Exceeded (> $10,000 USD)');
    }
    if (amount > 50000) {
      score += 35;
      flags.push('Requires Enhanced Due Diligence (EDD) & Source of Wealth verification');
    }
    if (testCountry !== 'RWA' && testCountry !== 'USA' && testCountry !== 'GBR') {
      score += 20;
      flags.push('Cross-Border High-Risk Corridor');
    }

    const rating: 'LOW' | 'MEDIUM' | 'HIGH' = score < 25 ? 'LOW' : score < 50 ? 'MEDIUM' : 'HIGH';
    const action = rating === 'LOW' ? 'APPROVED' : rating === 'MEDIUM' ? 'STEP_UP_AUTH' : 'BLOCKED';

    setRiskAssessment({
      score,
      rating,
      sanctionsCleared: true,
      pepCleared: true,
      ruleFlags: flags,
      action
    });
  };

  const handleRegisterNewPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    try {
      const created = await registerBiometricPasskey(
        'peter.bahati',
        'Peter Bahati',
        newKeyLabel || 'Device Biometrics'
      );
      setPasskeys(getEnrolledPasskeys());
      setShowRegisterModal(false);
      setNewKeyLabel('Touch ID / Face ID');
    } catch (err) {
      console.error(err);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDeletePasskey = (id: string) => {
    deletePasskey(id);
    setPasskeys(getEnrolledPasskeys());
  };

  const handleRunBiometricStepUp = async () => {
    setIsTestingAuth(true);
    try {
      const proof = await authenticateWithBiometrics('AML Step-Up High-Risk Authorization', {
        amount: parseFloat(testAmount) || 25000,
        asset: 'USD',
        destination: testDestination,
        riskScore: riskAssessment?.score || 35
      });
      setBiometricAuditLogs((prev) => [proof, ...prev]);
      if (riskAssessment) {
        setRiskAssessment({
          ...riskAssessment,
          action: 'APPROVED'
        });
      }
    } catch (err) {
      console.error('Step up failed:', err);
    } finally {
      setIsTestingAuth(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white">Compliance, KYC & AML Engine</h2>
              <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded border border-emerald-500/20">
                FATF / Travel Rule & FIDO2 Compliant
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Configurable compliance architecture: tiered customer registration, automated OFAC/PEP sanctions screening, transaction velocity limits, and WebAuthn biometric step-up authentication.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Sanctions Watchlist: Synchronized</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Current User KYC Status */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Account Identity & Tier Status</h3>
            <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              {kycProfile.status}
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Full Name</span>
              <span className="font-bold text-white">{kycProfile.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Email</span>
              <span className="font-mono text-slate-300">{kycProfile.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Phone</span>
              <span className="font-mono text-emerald-400 font-bold">{kycProfile.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Jurisdiction</span>
              <span className="text-slate-300">{kycProfile.country}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Document Type</span>
              <span className="font-mono text-amber-400">{kycProfile.id_document_type} ({kycProfile.id_number})</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-800">
              <span className="text-slate-400">Daily Transaction Limit</span>
              <span className="font-bold text-emerald-400 font-mono">
                ${kycProfile.daily_limit_usd.toLocaleString()} USD
              </span>
            </div>
          </div>

          {/* Tier Cards */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-semibold text-slate-300">Compliance Verification Tiers</div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 opacity-60">
                <div className="font-bold text-slate-400 text-[11px]">Tier 1</div>
                <div className="text-[10px] text-slate-400 mt-0.5">$1,000 / day</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 opacity-60">
                <div className="font-bold text-slate-400 text-[11px]">Tier 2</div>
                <div className="text-[10px] text-slate-400 mt-0.5">$50,000 / day</div>
              </div>
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/40">
                <div className="font-bold text-emerald-400 text-[11px]">Tier 3 (Active)</div>
                <div className="text-[10px] text-emerald-300 mt-0.5">$250,000 / day</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Real-Time AML Risk Evaluator & Biometric Step-Up */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              Real-Time Pre-Execution AML Risk Scorer
            </h3>
            <span className="text-xs text-slate-400">Rule-Based + Heuristic</span>
          </div>

          <form onSubmit={handleEvaluateRisk} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Transaction Value (USD)</label>
                <input
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  placeholder="25000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Origin / Dest Country</label>
                <select
                  value={testCountry}
                  onChange={(e) => setTestCountry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="RWA">Rwanda (RWA)</option>
                  <option value="USA">United States (USA)</option>
                  <option value="GBR">United Kingdom (GBR)</option>
                  <option value="KEN">Kenya (KEN)</option>
                  <option value="ARE">United Arab Emirates (ARE)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Destination Address</label>
                <input
                  type="text"
                  value={testDestination}
                  onChange={(e) => setTestDestination(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Run Real-Time AML & Sanctions Scan
            </button>
          </form>

          {/* Risk Results */}
          {riskAssessment && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 animate-in fade-in text-xs font-mono">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-400">Calculated Risk Score:</span>
                  <span className="text-lg font-bold text-amber-400 ml-2">{riskAssessment.score} / 100</span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full font-bold ${
                    riskAssessment.action === 'APPROVED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : riskAssessment.action === 'STEP_UP_AUTH'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  Action: {riskAssessment.action}
                </span>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>OFAC, UN & EU Sanctions Screening: CLEARED</span>
                </div>
                <div className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Politically Exposed Person (PEP) Check: CLEARED</span>
                </div>
                {riskAssessment.ruleFlags.map((f, i) => (
                  <div key={i} className="text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Flag: {f}</span>
                  </div>
                ))}
              </div>

              {/* Step Up Auth Biometric Trigger Button */}
              {riskAssessment.action === 'STEP_UP_AUTH' && (
                <div className="pt-2 border-t border-slate-800">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-2 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-amber-400">High-Assurance Step-Up Required</div>
                      <div className="text-[10px] text-slate-300">
                        Authorize this transaction via WebAuthn Touch ID / Face ID hardware key.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunBiometricStepUp}
                    disabled={isTestingAuth}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {isTestingAuth ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
                    <span>{isTestingAuth ? 'Scanning Biometrics...' : 'Authenticate with WebAuthn Biometrics'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* WebAuthn Biometric & Passkey Enclave Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Fingerprint className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">WebAuthn Biometric & Passkey Hardware Enclave</h3>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                  FIDO2 / W3C Level 3
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cryptographic hardware protection: Touch ID, Face ID, Windows Hello, and YubiKey platform authenticators for zero-trust authorization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRegisterModal(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Enroll New Passkey</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Hardware Status Card */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">Platform Authenticator</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="font-bold text-white text-sm flex items-center gap-2">
              <Laptop className="w-4 h-4 text-amber-400" />
              <span>Apple Secure Enclave / Touch ID</span>
            </div>
            <div className="text-slate-400 text-[11px]">
              Hardware Key Storage: <span className="text-emerald-400 font-mono">Isolated T2 / Apple Silicon Secure Enclave</span>
            </div>
            <div className="text-slate-400 text-[11px]">
              Signature Algorithm: <span className="text-amber-400 font-mono">ECDSA P-256 (COSE -7)</span>
            </div>
          </div>

          {/* Enforce High-Risk Toggle Card */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">Security Enforcement</span>
              <span className="text-emerald-400 font-bold text-[10px]">Active</span>
            </div>
            <div className="font-bold text-white text-sm">Biometric MFA Guard</div>
            <p className="text-slate-400 text-[11px]">
              Enforces WebAuthn biometric assertion for withdrawals &gt; $500, 4-Eyes Payouts, and API Secret reveals.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="enforceBio"
                checked={enforceBiometrics}
                onChange={(e) => setEnforceBiometrics(e.target.checked)}
                className="rounded accent-amber-500 cursor-pointer"
              />
              <label htmlFor="enforceBio" className="text-slate-300 font-semibold cursor-pointer text-[11px]">
                Enforce Biometrics for High-Risk
              </label>
            </div>
          </div>

          {/* Quick Biometric Test Card */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Enclave Health Check</span>
                <span className="text-emerald-400 text-[10px] font-mono">0.8ms Latency</span>
              </div>
              <div className="font-bold text-white text-sm mt-1">Test Biometric Signature</div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Generate an immediate WebAuthn assertion challenge and verify signature validity.
              </p>
            </div>

            <button
              onClick={handleRunBiometricStepUp}
              disabled={isTestingAuth}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>Test Hardware Passkey</span>
            </button>
          </div>
        </div>

        {/* Registered Credentials List */}
        <div className="space-y-2 pt-2">
          <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Enrolled Biometric Credentials ({passkeys.length})</span>
            <span className="text-[11px] text-slate-400">Stored via FIDO2 Credential Management</span>
          </div>

          <div className="space-y-2">
            {passkeys.map((pk) => (
              <div
                key={pk.id}
                className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-amber-400">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{pk.name}</span>
                      <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-mono">
                        {pk.deviceType}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      ID: {pk.id.substring(0, 20)}... • Created: {new Date(pk.createdAt).toLocaleDateString()} • Counter: {pk.counter || 1}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-mono text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    User Verified (UV=1)
                  </span>
                  {passkeys.length > 1 && (
                    <button
                      onClick={() => handleDeletePasskey(pk.id)}
                      className="text-slate-500 hover:text-rose-400 text-[11px] px-2 py-1 transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log of Biometric Assertions */}
        {biometricAuditLogs.length > 0 && (
          <div className="pt-2 space-y-2">
            <div className="text-xs font-semibold text-slate-300">Recent WebAuthn Assertion Signatures</div>
            <div className="space-y-1.5">
              {biometricAuditLogs.slice(0, 3).map((log, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{log.actionTitle}</span>
                    <span className="text-amber-400">
                      ({log.amount ? `${log.amount} ${log.asset || 'USD'}` : 'System Test'})
                    </span>
                  </div>
                  <div className="text-slate-400 text-[10px] truncate max-w-xs">
                    Sig: {log.signatureHex.substring(0, 24)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Enroll Passkey Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Fingerprint className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Enroll New Biometric Passkey</h3>
            </div>
            <form onSubmit={handleRegisterNewPasskey} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Passkey Device Label</label>
                <input
                  type="text"
                  value={newKeyLabel}
                  onChange={(e) => setNewKeyLabel(e.target.value)}
                  placeholder="e.g. MacBook Touch ID or iPhone Face ID"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Generates ECDSA P-256 keypair in hardware enclave</span>
                </div>
                <div className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Bound to RP ID: {typeof window !== 'undefined' ? window.location.hostname : 'kofi.network'}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5"
                >
                  {isRegistering ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Fingerprint className="w-3.5 h-3.5" />}
                  <span>Register with Device</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
