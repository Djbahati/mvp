import React, { useState } from 'react';
import {
  Building2,
  Key,
  FileText,
  Plus,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  Users,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Lock
} from 'lucide-react';
import {
  B2BMerchant,
  Invoice,
  ApiKey,
  MultiSigProposal,
  MultiSigPolicy,
  MultiSigSigner
} from '../types';
import { MultiSigGovernance } from './MultiSigGovernance';

interface B2BPortalProps {
  merchant: B2BMerchant;
  onCreateInvoice: (newInvoice: Omit<Invoice, 'id' | 'created_at' | 'payment_link_url' | 'status'>) => void;
  onGenerateApiKey: (name: string, env: 'LIVE' | 'SANDBOX') => void;
  onApproveFourEyesPayout: (payoutId: string) => void;
  onPayInvoice?: (invoiceId: string, method: 'MOMO' | 'CRYPTO') => void;
  onSignMultiSigProposal?: (proposalId: string, signerId: string) => void;
  onRejectMultiSigProposal?: (proposalId: string, signerId: string, reason: string) => void;
  onExecuteMultiSigProposal?: (proposalId: string) => void;
  onCreateMultiSigProposal?: (newProposal: Omit<MultiSigProposal, 'id' | 'created_at' | 'expires_at' | 'current_signatures_count' | 'signatures' | 'status'>) => void;
  onSaveMultiSigPolicy?: (policy: MultiSigPolicy) => void;
  onAddMultiSigSigner?: (signer: Omit<MultiSigSigner, 'id' | 'joined_at' | 'enrolled_webauthn'>) => void;
}

export const B2BPortal: React.FC<B2BPortalProps> = ({
  merchant,
  onCreateInvoice,
  onGenerateApiKey,
  onApproveFourEyesPayout,
  onPayInvoice,
  onSignMultiSigProposal,
  onRejectMultiSigProposal,
  onExecuteMultiSigProposal,
  onCreateMultiSigProposal,
  onSaveMultiSigPolicy,
  onAddMultiSigSigner
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'multisig' | 'invoices' | 'apikeys' | 'policy' | 'roles'>('multisig');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Local state fallbacks for MultiSig if not in merchant
  const [localProposals, setLocalProposals] = useState<MultiSigProposal[]>(merchant.multisig_proposals || []);
  const [localPolicies, setLocalPolicies] = useState<MultiSigPolicy[]>(merchant.multisig_policies || []);
  const [localSigners, setLocalSigners] = useState<MultiSigSigner[]>(merchant.multisig_signers || []);

  const proposals = merchant.multisig_proposals || localProposals;
  const policies = merchant.multisig_policies || localPolicies;
  const signers = merchant.multisig_signers || localSigners;

  const pendingMultiSigCount = proposals.filter((p) => p.status === 'PENDING_APPROVALS' || p.status === 'QUORUM_REACHED').length;

  // New Invoice Form State
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invAsset, setInvAsset] = useState('USDT');
  const [invDesc, setInvDesc] = useState('');

  // New API Key State
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyEnv, setKeyEnv] = useState<'LIVE' | 'SANDBOX'>('SANDBOX');

  // Simulated 4-Eyes Payout Queue
  const [pendingPayouts, setPendingPayouts] = useState([
    {
      id: 'payout_req_9921',
      recipient: 'Supplier: Kigali Grain Millers Ltd',
      amount: 14500,
      asset: 'USDT',
      initiator: 'Jane Mukamana (Finance Officer)',
      threshold: 5000,
      status: 'PENDING_SECOND_APPROVAL',
      created_at: '10 mins ago'
    }
  ]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !invAmount) {
      alert('Please fill customer name and amount');
      return;
    }

    onCreateInvoice({
      invoice_number: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      customer_name: custName,
      customer_email: custEmail,
      amount: parseFloat(invAmount),
      asset_symbol: invAsset,
      description: invDesc || 'B2B Professional Services',
      due_date: new Date(Date.now() + 86400000 * 14).toISOString()
    });

    setShowNewInvoiceModal(false);
    setCustName('');
    setCustEmail('');
    setInvAmount('');
    setInvDesc('');
  };

  const handleCreateKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName) {
      alert('Please enter a key description/name');
      return;
    }
    onGenerateApiKey(keyName, keyEnv);
    setShowNewKeyModal(false);
    setKeyName('');
  };

  const handleApprove = (id: string) => {
    setPendingPayouts((prev) => prev.filter((p) => p.id !== id));
    onApproveFourEyesPayout(id);
  };

  return (
    <div className="space-y-6">
      {/* Merchant Profile Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20">
              <Building2 className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{merchant.name}</h2>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                  {merchant.kyb_status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Reg: {merchant.registration_no} • ID: {merchant.merchant_id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Multi-Sig Quorum:</span>
              <span className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-amber-400 font-bold">
                3-of-4 Board Quorum
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">4-Eyes Rule:</span>
              <span className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 font-semibold">
                &gt; ${merchant.payout_policy.four_eyes_threshold.toLocaleString()} USD
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* B2B Sub-navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('multisig')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'multisig'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Multi-Sig Governance ({pendingMultiSigCount})
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('invoices')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'invoices'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Invoices & Payment Links ({merchant.invoices.length})
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('apikeys')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'apikeys'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5" />
            API Keys & Webhooks ({merchant.api_keys.length})
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('policy')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'policy'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            4-Eyes Dual Approvals ({pendingPayouts.length})
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('roles')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'roles'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            RBAC Org Roles
          </span>
        </button>
      </div>

      {/* Sub-tab 0: Multi-Signature Governance */}
      {activeSubTab === 'multisig' && (
        <MultiSigGovernance
          proposals={proposals}
          policies={policies}
          signers={signers}
          onSignProposal={(propId, signerId) => {
            if (onSignMultiSigProposal) {
              onSignMultiSigProposal(propId, signerId);
            } else {
              // Local fallback
              setLocalProposals((prev) =>
                prev.map((p) => {
                  if (p.id !== propId) return p;
                  const signer = signers.find((s) => s.id === signerId);
                  const updatedSigs = p.signatures.map((s) =>
                    s.signer_id === signerId
                      ? {
                          ...s,
                          status: 'SIGNED' as const,
                          signature_hash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
                          signed_at: new Date().toISOString(),
                          biometric_attestation_type: 'WEBAUTHN_FIDO2' as const
                        }
                      : s
                  );
                  const count = updatedSigs.filter((s) => s.status === 'SIGNED').length;
                  return {
                    ...p,
                    signatures: updatedSigs,
                    current_signatures_count: count,
                    status: count >= p.required_signatures ? 'QUORUM_REACHED' : 'PENDING_APPROVALS'
                  };
                })
              );
            }
          }}
          onRejectProposal={(propId, signerId, reason) => {
            if (onRejectMultiSigProposal) {
              onRejectMultiSigProposal(propId, signerId, reason);
            } else {
              setLocalProposals((prev) =>
                prev.map((p) => {
                  if (p.id !== propId) return p;
                  const updatedSigs = p.signatures.map((s) =>
                    s.signer_id === signerId
                      ? { ...s, status: 'REJECTED' as const, rejection_reason: reason }
                      : s
                  );
                  return { ...p, signatures: updatedSigs, status: 'REJECTED' };
                })
              );
            }
          }}
          onExecuteProposal={(propId) => {
            if (onExecuteMultiSigProposal) {
              onExecuteMultiSigProposal(propId);
            } else {
              setLocalProposals((prev) =>
                prev.map((p) =>
                  p.id === propId
                    ? {
                        ...p,
                        status: 'EXECUTED_TO_LEDGER',
                        executed_at: new Date().toISOString(),
                        ledger_tx_id: `tx_msig_${Date.now()}`,
                        merkle_proof_hash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
                      }
                    : p
                )
              );
            }
          }}
          onCreateProposal={(newProp) => {
            if (onCreateMultiSigProposal) {
              onCreateMultiSigProposal(newProp);
            } else {
              const id = `msp_2026_${Math.floor(1000 + Math.random() * 9000)}`;
              const fullProp: MultiSigProposal = {
                ...newProp,
                id,
                current_signatures_count: 1,
                status: 'PENDING_APPROVALS',
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 86400000 * 3).toISOString(),
                signatures: signers.map((s) => ({
                  signer_id: s.id,
                  signer_name: s.name,
                  signer_role: s.role,
                  status: s.id === newProp.initiator_id ? ('SIGNED' as const) : ('PENDING' as const),
                  signature_hash:
                    s.id === newProp.initiator_id
                      ? '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
                      : undefined,
                  signed_at: s.id === newProp.initiator_id ? new Date().toISOString() : undefined,
                  biometric_attestation_type: s.id === newProp.initiator_id ? 'WEBAUTHN_FIDO2' : undefined
                }))
              };
              setLocalProposals((prev) => [fullProp, ...prev]);
            }
          }}
          onSavePolicy={(updatedPol) => {
            if (onSaveMultiSigPolicy) {
              onSaveMultiSigPolicy(updatedPol);
            } else {
              setLocalPolicies((prev) => prev.map((p) => (p.id === updatedPol.id ? updatedPol : p)));
            }
          }}
          onAddSigner={(newSignerData) => {
            if (onAddMultiSigSigner) {
              onAddMultiSigSigner(newSignerData);
            } else {
              const newSigner: MultiSigSigner = {
                ...newSignerData,
                id: `sgn_${Date.now()}`,
                enrolled_webauthn: true,
                joined_at: new Date().toISOString()
              };
              setLocalSigners((prev) => [...prev, newSigner]);
            }
          }}
        />
      )}

      {/* Sub-tab 1: Invoices & Payment Links */}
      {activeSubTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white text-sm">Merchant Invoices & Hosted Checkout Links</h3>
              <p className="text-xs text-slate-400">Accept Mobile Money, Crypto & Fiat from global clients</p>
            </div>
            <button
              onClick={() => setShowNewInvoiceModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice / Payment Link</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {merchant.invoices.map((inv) => (
              <div
                key={inv.id}
                className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-400 text-xs">{inv.invoice_number}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      inv.status === 'PAID'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>

                <div>
                  <div className="text-lg font-extrabold text-white">
                    {inv.amount.toLocaleString()} {inv.asset_symbol}
                  </div>
                  <div className="text-xs text-slate-300 font-medium">{inv.customer_name}</div>
                  <div className="text-[11px] text-slate-400">{inv.description}</div>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">
                      {inv.payment_link_url}
                    </div>
                    <button
                      onClick={() => handleCopy(inv.payment_link_url, inv.id)}
                      className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                    >
                      {copiedKeyId === inv.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKeyId === inv.id ? 'Copied' : 'Copy Link'}</span>
                    </button>
                  </div>

                  {inv.status === 'PENDING' && onPayInvoice && (
                    <div className="pt-1.5 flex gap-2">
                      <button
                        onClick={() => onPayInvoice(inv.id, 'MOMO')}
                        className="flex-1 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                      >
                        ⚡ Simulate MoMo (*951#) Pay
                      </button>
                      <button
                        onClick={() => onPayInvoice(inv.id, 'CRYPTO')}
                        className="flex-1 py-1.5 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                      >
                        💎 Simulate Crypto Pay
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-tab 2: API Keys & Webhooks */}
      {activeSubTab === 'apikeys' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white text-sm">Developer API Keys & Webhook Endpoints</h3>
              <p className="text-xs text-slate-400">Integrate Kofi into POS systems, apps, and e-commerce platforms</p>
            </div>
            <button
              onClick={() => setShowNewKeyModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Generate New API Key</span>
            </button>
          </div>

          <div className="space-y-3">
            {merchant.api_keys.map((k) => (
              <div
                key={k.id}
                className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-sm">{k.key_name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        k.environment === 'LIVE'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      }`}
                    >
                      {k.environment}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span>Public: <span className="text-slate-200">{k.public_key}</span></span>
                    <span>Secret: <span className="text-amber-400">{k.secret_preview}</span></span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">Rate Limit: {k.rate_limit_rpm} req/min</span>
                  <button
                    onClick={() => handleCopy(k.public_key, k.id)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                    title="Copy Public Key"
                  >
                    {copiedKeyId === k.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-tab 3: 4-Eyes Payout Policy Approval Queue */}
      {activeSubTab === 'policy' && (
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-white text-sm">Policy Engine: Four-Eyes (Dual Control) Approvals</h3>
            <p className="text-xs text-slate-400">
              High-value disbursements require independent cryptographic approval from two authorized officers before the Rust Ledger executes balance debits.
            </p>
          </div>

          {pendingPayouts.length > 0 ? (
            <div className="space-y-3">
              {pendingPayouts.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-900 border-2 border-amber-500/40 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span className="font-mono font-bold text-amber-400 text-xs">{p.id}</span>
                      <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded">
                        Requires 2nd Signer
                      </span>
                    </div>
                    <div className="text-lg font-bold text-white mt-1">
                      {p.amount.toLocaleString()} {p.asset}
                    </div>
                    <div className="text-xs text-slate-300">{p.recipient}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Initiated by: {p.initiator} ({p.created_at})
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(p.id)}
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Authorize via WebAuthn Biometrics</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <span>All 4-Eyes Payout approvals are up to date. Zero pending queues.</span>
            </div>
          )}
        </div>
      )}

      {/* Sub-tab 4: RBAC Roles */}
      {activeSubTab === 'roles' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-sm">Role-Based Access Control (RBAC) Hierarchy</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="font-bold text-amber-400">1. Owner / Superadmin</div>
              <p className="text-slate-400 text-[11px] mt-1">Full platform authority, policy changes, key revocation.</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="font-bold text-emerald-400">2. Finance Director</div>
              <p className="text-slate-400 text-[11px] mt-1">4-Eyes payout approvals, treasury sweep & settlement.</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="font-bold text-sky-400">3. Finance Manager</div>
              <p className="text-slate-400 text-[11px] mt-1">Invoice issuance, payment link creation, payout initiation.</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="font-bold text-indigo-400">4. API Integration User</div>
              <p className="text-slate-400 text-[11px] mt-1">Scoped programmatic access via HMAC signed requests.</p>
            </div>
          </div>
        </div>
      )}

      {/* New Invoice Modal */}
      {showNewInvoiceModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-3">Create B2B Invoice & Payment Link</h3>
            <form onSubmit={handleCreateInvoiceSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Customer / Entity Name</label>
                <input
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="e.g. Kigali Logistics Ltd"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Customer Email</label>
                <input
                  type="email"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  placeholder="finance@client.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Amount</label>
                  <input
                    type="number"
                    value={invAmount}
                    onChange={(e) => setInvAmount(e.target.value)}
                    placeholder="1000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Currency</label>
                  <select
                    value={invAsset}
                    onChange={(e) => setInvAsset(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="USDT">USDT</option>
                    <option value="RWF">RWF (MoMo)</option>
                    <option value="USD">USD</option>
                    <option value="USDC">USDC</option>
                    <option value="BTC">BTC</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <input
                  type="text"
                  value={invDesc}
                  onChange={(e) => setInvDesc(e.target.value)}
                  placeholder="Goods delivery & freight escrow"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Generate Link & QR
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewInvoiceModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New API Key Modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-3">Generate Developer API Key</h3>
            <form onSubmit={handleCreateKeySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Key Description / Purpose</label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Mobile App Checkout API"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Environment</label>
                <select
                  value={keyEnv}
                  onChange={(e) => setKeyEnv(e.target.value as 'LIVE' | 'SANDBOX')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="SANDBOX">Sandbox (Test Environment)</option>
                  <option value="LIVE">Production (Live Transactions)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Generate Credentials
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewKeyModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
