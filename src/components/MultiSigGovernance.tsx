import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Key,
  Fingerprint,
  Plus,
  ArrowRight,
  FileCheck2,
  Lock,
  Unlock,
  Check,
  Copy,
  ExternalLink,
  Sliders,
  ChevronDown,
  ChevronUp,
  Hash,
  Sparkles,
  Smartphone,
  CreditCard,
  Building,
  RefreshCw,
  XCircle,
  Eye,
  Send
} from 'lucide-react';
import {
  MultiSigProposal,
  MultiSigPolicy,
  MultiSigSigner,
  MultiSigSignature
} from '../types';

interface MultiSigGovernanceProps {
  proposals: MultiSigProposal[];
  policies: MultiSigPolicy[];
  signers: MultiSigSigner[];
  currentSignerId?: string;
  onSignProposal: (proposalId: string, signerId: string) => void;
  onRejectProposal: (proposalId: string, signerId: string, reason: string) => void;
  onExecuteProposal: (proposalId: string) => void;
  onCreateProposal: (newProposal: Omit<MultiSigProposal, 'id' | 'created_at' | 'expires_at' | 'current_signatures_count' | 'signatures' | 'status'>) => void;
  onSavePolicy: (policy: MultiSigPolicy) => void;
  onAddSigner: (signer: Omit<MultiSigSigner, 'id' | 'joined_at' | 'enrolled_webauthn'>) => void;
}

export const MultiSigGovernance: React.FC<MultiSigGovernanceProps> = ({
  proposals,
  policies,
  signers,
  currentSignerId = 'sgn_01',
  onSignProposal,
  onRejectProposal,
  onExecuteProposal,
  onCreateProposal,
  onSavePolicy,
  onAddSigner
}) => {
  const [activeView, setActiveView] = useState<'proposals' | 'policies' | 'signers' | 'ledger_audit'>('proposals');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'QUORUM' | 'EXECUTED'>('ALL');
  const [selectedSignerId, setSelectedSignerId] = useState<string>(currentSignerId);
  const [expandedProposalId, setExpandedProposalId] = useState<string | null>(proposals[0]?.id || null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Modal States
  const [showNewProposalModal, setShowNewProposalModal] = useState(false);
  const [showNewSignerModal, setShowNewSignerModal] = useState(false);
  const [showEditPolicyModal, setShowEditPolicyModal] = useState<MultiSigPolicy | null>(null);
  const [rejectingProposalId, setRejectingProposalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // New Proposal Form State
  const [propTitle, setPropTitle] = useState('');
  const [propDesc, setPropDesc] = useState('');
  const [propAmount, setPropAmount] = useState('');
  const [propAsset, setPropAsset] = useState('USDT');
  const [propDest, setPropDest] = useState('');
  const [propDestType, setPropDestType] = useState<MultiSigProposal['destination_type']>('SUPPLIER_PAYOUT');
  const [propPolicyId, setPropPolicyId] = useState<string>(policies[0]?.id || 'pol_3_of_4_treasury');

  // New Signer Form State
  const [newSignerName, setNewSignerName] = useState('');
  const [newSignerRole, setNewSignerRole] = useState<MultiSigSigner['role']>('CHIEF_RISK_OFFICER');
  const [newSignerEmail, setNewSignerEmail] = useState('');
  const [newSignerPhone, setNewSignerPhone] = useState('+250 7');
  const [newSignerPubKey, setNewSignerPubKey] = useState('0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredProposals = proposals.filter((p) => {
    if (statusFilter === 'PENDING') return p.status === 'PENDING_APPROVALS';
    if (statusFilter === 'QUORUM') return p.status === 'QUORUM_REACHED';
    if (statusFilter === 'EXECUTED') return p.status === 'EXECUTED_TO_LEDGER';
    return true;
  });

  const pendingCount = proposals.filter((p) => p.status === 'PENDING_APPROVALS').length;
  const quorumCount = proposals.filter((p) => p.status === 'QUORUM_REACHED').length;
  const executedCount = proposals.filter((p) => p.status === 'EXECUTED_TO_LEDGER').length;

  const currentSigner = signers.find((s) => s.id === selectedSignerId) || signers[0];

  const handleCreateProposalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propTitle || !propAmount || !propDest) {
      alert('Please fill all required fields');
      return;
    }

    const selectedPolicy = policies.find((p) => p.id === propPolicyId) || policies[0];
    const amountNum = parseFloat(propAmount);
    
    // Estimate USD equivalent
    let usdEq = amountNum;
    if (propAsset === 'RWF') usdEq = Math.round((amountNum / 1380) * 100) / 100;
    if (propAsset === 'BTC') usdEq = amountNum * 67500;
    if (propAsset === 'ETH') usdEq = amountNum * 3450;
    if (propAsset === 'EUR') usdEq = amountNum * 1.09;
    if (propAsset === 'GBP') usdEq = amountNum * 1.28;

    onCreateProposal({
      policy_id: selectedPolicy.id,
      title: propTitle,
      description: propDesc || 'Multi-signature corporate treasury disbursement',
      amount: amountNum,
      asset_symbol: propAsset,
      usd_equivalent: usdEq,
      destination: propDest,
      destination_type: propDestType,
      initiator_name: currentSigner.name,
      initiator_role: currentSigner.role,
      initiator_id: currentSigner.id,
      required_signatures: selectedPolicy.required_signatures_n,
      total_signers: selectedPolicy.total_signers_m
    });

    setShowNewProposalModal(false);
    setPropTitle('');
    setPropDesc('');
    setPropAmount('');
    setPropDest('');
  };

  const handleAddSignerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSignerName || !newSignerEmail) {
      alert('Please provide name and email');
      return;
    }
    onAddSigner({
      name: newSignerName,
      role: newSignerRole,
      email: newSignerEmail,
      phone: newSignerPhone,
      public_key: newSignerPubKey,
      status: 'ACTIVE'
    });
    setShowNewSignerModal(false);
    setNewSignerName('');
    setNewSignerEmail('');
  };

  const handleConfirmRejection = () => {
    if (rejectingProposalId) {
      onRejectProposal(rejectingProposalId, selectedSignerId, rejectionReason || 'Rejected by authorized board officer');
      setRejectingProposalId(null);
      setRejectionReason('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Multi-Signature Governance
                  <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    N-of-M Quorum
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Cryptographic board-level governance for high-value treasury operations, disbursements, and MoMo batch payouts.
                </p>
              </div>
            </div>

            {/* Active Signer Selector Switcher */}
            <div className="pt-2 flex items-center gap-3">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-amber-400" />
                Active Signer Session:
              </span>
              <select
                value={selectedSignerId}
                onChange={(e) => setSelectedSignerId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white font-semibold text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-500"
              >
                {signers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role}) • {s.enrolled_webauthn ? 'Passkey Enrolled' : 'Pending'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Metrics Bento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[11px] text-slate-400 font-medium">Pending Approvals</div>
              <div className="text-xl font-black text-amber-400 mt-0.5">{pendingCount}</div>
              <div className="text-[10px] text-slate-500">Awaiting Signers</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[11px] text-slate-400 font-medium">Quorum Reached</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">{quorumCount}</div>
              <div className="text-[10px] text-slate-500">Ready for Ledger</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[11px] text-slate-400 font-medium">Executed & Settled</div>
              <div className="text-xl font-black text-sky-400 mt-0.5">{executedCount}</div>
              <div className="text-[10px] text-slate-500">Immutable Ledger</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[11px] text-slate-400 font-medium">Enrolled Board</div>
              <div className="text-xl font-black text-indigo-400 mt-0.5">{signers.length}</div>
              <div className="text-[10px] text-slate-500">M Signers Active</div>
            </div>
          </div>
        </div>

        {/* View Switcher & Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'proposals', label: `Proposals Queue (${proposals.length})`, icon: FileCheck2 },
              { id: 'policies', label: `Governance Policies (${policies.length})`, icon: Sliders },
              { id: 'signers', label: `Authorized Signers (${signers.length})`, icon: Users },
              { id: 'ledger_audit', label: 'Ledger Multi-Sig Proofs', icon: Hash }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-amber-400 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewProposalModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Propose Multi-Sig Transfer</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. PROPOSALS QUEUE VIEW */}
      {activeView === 'proposals' && (
        <div className="space-y-4">
          {/* Status Filters Bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {[
                { id: 'ALL', label: 'All Proposals' },
                { id: 'PENDING', label: `Pending Approvals (${pendingCount})` },
                { id: 'QUORUM', label: `Quorum Reached (${quorumCount})` },
                { id: 'EXECUTED', label: `Executed (${executedCount})` }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id as any)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    statusFilter === f.id
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Signing as: <span className="text-amber-400 font-bold">{currentSigner.name}</span> ({currentSigner.role})
            </div>
          </div>

          {/* Proposals List */}
          <div className="space-y-4">
            {filteredProposals.map((proposal) => {
              const isExpanded = expandedProposalId === proposal.id;
              const policy = policies.find((p) => p.id === proposal.policy_id);
              const progressPct = Math.round((proposal.current_signatures_count / proposal.required_signatures) * 100);
              
              // Check if current active signer already signed this proposal
              const mySignature = proposal.signatures.find((s) => s.signer_id === selectedSignerId);
              const hasCurrentSignerSigned = mySignature?.status === 'SIGNED';
              const isQuorumReady = proposal.current_signatures_count >= proposal.required_signatures && proposal.status !== 'EXECUTED_TO_LEDGER';

              return (
                <div
                  key={proposal.id}
                  className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all ${
                    proposal.status === 'QUORUM_REACHED'
                      ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/5'
                      : proposal.status === 'PENDING_APPROVALS'
                      ? 'border-amber-500/40'
                      : 'border-slate-800'
                  }`}
                >
                  {/* Card Header & Main Info */}
                  <div className="p-5 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-amber-400 text-xs">{proposal.id}</span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                              proposal.status === 'QUORUM_REACHED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : proposal.status === 'EXECUTED_TO_LEDGER'
                                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                                : proposal.status === 'REJECTED'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {proposal.status === 'PENDING_APPROVALS'
                              ? `Awaiting Signatures (${proposal.current_signatures_count}/${proposal.required_signatures})`
                              : proposal.status === 'QUORUM_REACHED'
                              ? `Quorum Reached (${proposal.required_signatures}-of-${proposal.total_signers})`
                              : proposal.status.replace(/_/g, ' ')}
                          </span>

                          <span className="bg-slate-950 text-slate-400 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-800">
                            {proposal.destination_type.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-white">{proposal.title}</h3>
                        <p className="text-xs text-slate-400">{proposal.description}</p>
                      </div>

                      {/* Amount & Value Display */}
                      <div className="text-left md:text-right bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                        <div className="text-xl font-black text-white">
                          {proposal.amount.toLocaleString()} <span className="text-amber-400">{proposal.asset_symbol}</span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          ≈ ${proposal.usd_equivalent.toLocaleString()} USD
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Signer Status Chips */}
                    <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-300">Quorum Progress:</span>
                          <span className="font-mono font-bold text-amber-400">
                            {proposal.current_signatures_count} of {proposal.required_signatures} Required Approvals ({proposal.total_signers} Board Seats)
                          </span>
                        </div>
                        <span className="text-slate-400 font-mono text-[11px]">{Math.min(100, progressPct)}%</span>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            proposal.status === 'QUORUM_REACHED' || proposal.status === 'EXECUTED_TO_LEDGER'
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              : 'bg-gradient-to-r from-amber-500 to-amber-400'
                          }`}
                          style={{ width: `${Math.min(100, progressPct)}%` }}
                        />
                      </div>

                      {/* Destination Details & Initiator */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-[11px] text-slate-400">
                        <div className="flex items-center gap-2 truncate">
                          <span>Destination:</span>
                          <span className="font-mono text-slate-200 truncate">{proposal.destination}</span>
                        </div>
                        <div>
                          Initiated by: <span className="text-slate-200 font-semibold">{proposal.initiator_name}</span> ({proposal.initiator_role})
                        </div>
                      </div>
                    </div>

                    {/* Signatures Collection Matrix / Detail Expand */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-amber-400" />
                          Signature Collection Trail ({proposal.signatures.length} Signers)
                        </span>

                        <button
                          onClick={() => setExpandedProposalId(isExpanded ? null : proposal.id)}
                          className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <span>{isExpanded ? 'Hide Signature Hashes' : 'View ECDSA Cryptographic Hashes'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Signers Pill Matrix */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                        {proposal.signatures.map((sig) => {
                          const isSigned = sig.status === 'SIGNED';
                          const isRejected = sig.status === 'REJECTED';
                          const isPending = sig.status === 'PENDING';

                          return (
                            <div
                              key={sig.signer_id}
                              className={`p-3 rounded-xl border text-xs transition-all ${
                                isSigned
                                  ? 'bg-emerald-500/5 border-emerald-500/30'
                                  : isRejected
                                  ? 'bg-rose-500/5 border-rose-500/30'
                                  : 'bg-slate-950 border-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-white truncate">{sig.signer_name}</span>
                                {isSigned ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                ) : isRejected ? (
                                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                )}
                              </div>

                              <div className="text-[10px] text-slate-400">{sig.signer_role}</div>

                              <div className="mt-2 flex items-center justify-between text-[10px]">
                                <span
                                  className={`font-semibold ${
                                    isSigned
                                      ? 'text-emerald-400'
                                      : isRejected
                                      ? 'text-rose-400'
                                      : 'text-amber-400'
                                  }`}
                                >
                                  {isSigned ? 'Biometric Signed' : isRejected ? 'Rejected' : 'Awaiting'}
                                </span>
                                {sig.signed_at && (
                                  <span className="text-slate-500 font-mono">
                                    {new Date(sig.signed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Expandable Cryptographic Hashes & Ledger Chain Inspection */}
                      {isExpanded && (
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs animate-fadeIn">
                          <div className="font-bold text-slate-200 text-xs flex items-center justify-between">
                            <span>ECDSA P-256 & WebAuthn Biometric Attestations</span>
                            <span className="text-[10px] font-mono text-emerald-400">Cryptographically Chained</span>
                          </div>

                          <div className="space-y-2">
                            {proposal.signatures.map((sig) => (
                              <div
                                key={sig.signer_id}
                                className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                              >
                                <div>
                                  <div className="font-semibold text-slate-200 text-[11px]">
                                    {sig.signer_name} ({sig.signer_role})
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-400">
                                    {sig.status === 'SIGNED' ? (
                                      <span className="text-emerald-400">
                                        Signature: {sig.signature_hash}
                                      </span>
                                    ) : sig.status === 'REJECTED' ? (
                                      <span className="text-rose-400">Reason: {sig.rejection_reason}</span>
                                    ) : (
                                      <span className="text-amber-400/80">Pending authorization prompt</span>
                                    )}
                                  </div>
                                </div>

                                {sig.signature_hash && (
                                  <button
                                    onClick={() => handleCopy(sig.signature_hash!, sig.signer_id)}
                                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer self-end sm:self-center"
                                  >
                                    {copiedHash === sig.signer_id ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                    <span>Copy Sig</span>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          {proposal.ledger_tx_id && (
                            <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-emerald-400">Committed to Rust Ledger:</span>{' '}
                                <span className="font-mono text-white">{proposal.ledger_tx_id}</span>
                              </div>
                              <span className="font-mono text-[10px] text-slate-400">
                                Merkle Proof: {proposal.merkle_proof_hash?.substring(0, 16)}...
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Interactive Action Footer */}
                    <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          Expires: {new Date(proposal.expires_at).toLocaleDateString()} at{' '}
                          {new Date(proposal.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* If proposal is still pending and current signer hasn't signed */}
                        {proposal.status === 'PENDING_APPROVALS' && !hasCurrentSignerSigned && (
                          <>
                            <button
                              onClick={() => {
                                setRejectingProposalId(proposal.id);
                              }}
                              className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded-xl border border-rose-500/30 transition-colors cursor-pointer"
                            >
                              Reject
                            </button>

                            <button
                              onClick={() => onSignProposal(proposal.id, selectedSignerId)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                            >
                              <Fingerprint className="w-4 h-4" />
                              <span>Sign as {currentSigner.name} (WebAuthn)</span>
                            </button>
                          </>
                        )}

                        {/* If current signer already signed and proposal is still pending */}
                        {proposal.status === 'PENDING_APPROVALS' && hasCurrentSignerSigned && (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Signed by You ({currentSigner.role}) • Awaiting Co-Signers</span>
                          </div>
                        )}

                        {/* If Quorum Reached: Ready to Execute & Post to Ledger */}
                        {proposal.status === 'QUORUM_REACHED' && (
                          <button
                            onClick={() => onExecuteProposal(proposal.id)}
                            className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Execute Multi-Sig Transfer & Commit to Ledger</span>
                          </button>
                        )}

                        {/* If already executed */}
                        {proposal.status === 'EXECUTED_TO_LEDGER' && (
                          <div className="flex items-center gap-1.5 text-xs text-sky-400 font-bold bg-sky-500/10 px-3.5 py-1.5 rounded-xl border border-sky-500/20">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Executed & Locked in Rust Ledger</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. GOVERNANCE POLICIES VIEW */}
      {activeView === 'policies' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white text-sm">Multi-Signature Quorum Rules & Thresholds</h3>
              <p className="text-xs text-slate-400">
                Define the mathematical N-of-M signature thresholds, USD triggers, and timelocks for corporate funds.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {policies.map((policy) => (
              <div
                key={policy.id}
                className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="bg-amber-500/15 text-amber-400 text-xs font-black px-2.5 py-1 rounded-lg border border-amber-500/30">
                      {policy.required_signatures_n}-of-{policy.total_signers_m} Quorum
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        policy.is_active
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {policy.is_active ? 'ACTIVE POLICY' : 'INACTIVE'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{policy.name}</h4>
                  <p className="text-xs text-slate-400">{policy.description}</p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Trigger Threshold:</span>
                    <span className="font-mono font-bold text-white">&gt; ${policy.threshold_amount_usd.toLocaleString()} USD</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Timelock Grace:</span>
                    <span className="font-mono text-slate-300">{policy.timelock_hours} Hours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Auto-Execute on Quorum:</span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      {policy.auto_execute_on_quorum ? 'Enabled' : 'Manual Trigger Required'}
                    </span>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setShowEditPolicyModal(policy)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      <span>Adjust Quorum Parameters</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. AUTHORIZED SIGNERS REGISTRY */}
      {activeView === 'signers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white text-sm">Authorized Corporate Signers (M Board Members)</h3>
              <p className="text-xs text-slate-400">
                Authorized cryptographic signers enrolled with WebAuthn Passkeys and hardware security tokens.
              </p>
            </div>
            <button
              onClick={() => setShowNewSignerModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Enroll Board Signer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {signers.map((s) => (
              <div
                key={s.id}
                className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-sm">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{s.name}</div>
                      <div className="text-xs text-slate-400">{s.role.replace(/_/g, ' ')}</div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      s.enrolled_webauthn
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {s.enrolled_webauthn ? 'WebAuthn Enrolled' : 'Pending Enrollment'}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs font-mono text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Email:</span>
                    <span className="text-slate-200">{s.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Phone:</span>
                    <span className="text-slate-200">{s.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Public Key:</span>
                    <span className="text-amber-400 truncate max-w-[180px]">{s.public_key}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. LEDGER MULTI-SIG PROOFS & MERKLE AUDIT */}
      {activeView === 'ledger_audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Hash className="w-4 h-4 text-emerald-400" />
                <span>Multi-Signature Ledger Verification & Merkle Audit Trail</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Every N-of-M transaction execution commits an immutable SHA-256 cryptographic proof to the double-entry ledger.
              </p>
            </div>
            <span className="bg-emerald-500/10 text-emerald-400 text-xs font-mono px-3 py-1 rounded-xl border border-emerald-500/20">
              Rust Engine: Invariant Verified
            </span>
          </div>

          <div className="space-y-3">
            {proposals
              .filter((p) => p.status === 'EXECUTED_TO_LEDGER')
              .map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-amber-400">{p.id} • {p.title}</span>
                    <span className="bg-sky-500/10 text-sky-400 font-mono text-[10px] px-2 py-0.5 rounded">
                      Tx ID: {p.ledger_tx_id}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-slate-400 text-[11px] pt-1">
                    <div>Amount: <span className="text-white font-bold">{p.amount.toLocaleString()} {p.asset_symbol}</span></div>
                    <div>Signatures Collected: <span className="text-emerald-400 font-bold">{p.current_signatures_count} of {p.required_signatures} (Quorum Verified)</span></div>
                    <div>Executed At: <span className="text-slate-300 font-mono">{p.executed_at ? new Date(p.executed_at).toLocaleString() : 'Recent'}</span></div>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-400 flex items-center justify-between truncate">
                    <span className="truncate">Merkle Leaf: {p.merkle_proof_hash}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-sans">Double-Entry Balanced</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Modal 1: Create New Multi-Sig Proposal */}
      {showNewProposalModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>Initiate Multi-Signature Proposal</span>
              </h3>
              <button
                onClick={() => setShowNewProposalModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProposalSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Proposal Title</label>
                <input
                  type="text"
                  value={propTitle}
                  onChange={(e) => setPropTitle(e.target.value)}
                  placeholder="e.g. Bulk Fertilizer Supplier Payout"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Governance Quorum Policy</label>
                <select
                  value={propPolicyId}
                  onChange={(e) => setPropPolicyId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  {policies.map((pol) => (
                    <option key={pol.id} value={pol.id}>
                      {pol.name} ({pol.required_signatures_n}-of-{pol.total_signers_m} Quorum • &gt;${pol.threshold_amount_usd})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Transfer Amount</label>
                  <input
                    type="number"
                    value={propAmount}
                    onChange={(e) => setPropAmount(e.target.value)}
                    placeholder="10000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Asset</label>
                  <select
                    value={propAsset}
                    onChange={(e) => setPropAsset(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="USDT">USDT (TRC-20 / ERC-20)</option>
                    <option value="USDC">USDC (Polygon PoS)</option>
                    <option value="RWF">RWF (MTN / Airtel MoMo)</option>
                    <option value="USD">USD (Fedwire / SWIFT)</option>
                    <option value="EUR">EUR (SEPA Instant)</option>
                    <option value="GBP">GBP (Faster Payments)</option>
                    <option value="BTC">BTC (SegWit Vault)</option>
                    <option value="ETH">ETH (Mainnet)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Operation Type</label>
                <select
                  value={propDestType}
                  onChange={(e) => setPropDestType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="SUPPLIER_PAYOUT">Supplier Settlement Payout</option>
                  <option value="MOMO_BULK_DISBURSE">Mobile Money Bulk Payout (*951#)</option>
                  <option value="TREASURY_SWEEP">Treasury & FX Liquidity Sweep</option>
                  <option value="CROSS_BORDER_SETTLEMENT">Cross-Border Clearing</option>
                  <option value="ESCROW_RELEASE">Escrow Contract Release</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Destination Address / Account / Phone</label>
                <input
                  type="text"
                  value={propDest}
                  onChange={(e) => setPropDest(e.target.value)}
                  placeholder="e.g. 0x71C9... / +250 780 455 033 / IBAN"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Business Justification & Notes</label>
                <textarea
                  value={propDesc}
                  onChange={(e) => setPropDesc(e.target.value)}
                  rows={2}
                  placeholder="State the purpose of this high-value disbursement for board audit records"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Submit Proposal for Signatures
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewProposalModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Adjust Policy */}
      {showEditPolicyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Adjust Quorum Parameters: {showEditPolicyModal.name}</h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Required Signatures (N)</label>
                  <input
                    type="number"
                    min={1}
                    max={showEditPolicyModal.total_signers_m}
                    value={showEditPolicyModal.required_signatures_n}
                    onChange={(e) =>
                      setShowEditPolicyModal({
                        ...showEditPolicyModal,
                        required_signatures_n: parseInt(e.target.value) || 1
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Total Board Signers (M)</label>
                  <input
                    type="number"
                    min={showEditPolicyModal.required_signatures_n}
                    value={showEditPolicyModal.total_signers_m}
                    onChange={(e) =>
                      setShowEditPolicyModal({
                        ...showEditPolicyModal,
                        total_signers_m: parseInt(e.target.value) || 1
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Threshold Amount (USD Trigger)</label>
                <input
                  type="number"
                  value={showEditPolicyModal.threshold_amount_usd}
                  onChange={(e) =>
                    setShowEditPolicyModal({
                      ...showEditPolicyModal,
                      threshold_amount_usd: parseFloat(e.target.value) || 0
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="auto_exec"
                  checked={showEditPolicyModal.auto_execute_on_quorum}
                  onChange={(e) =>
                    setShowEditPolicyModal({
                      ...showEditPolicyModal,
                      auto_execute_on_quorum: e.target.checked
                    })
                  }
                  className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0"
                />
                <label htmlFor="auto_exec" className="text-slate-300 text-xs cursor-pointer">
                  Auto-commit to Rust Ledger immediately when Quorum is reached
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    onSavePolicy(showEditPolicyModal);
                    setShowEditPolicyModal(null);
                  }}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Save Policy Configuration
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditPolicyModal(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Enroll New Signer */}
      {showNewSignerModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Enroll Authorized Board Signer</h3>

            <form onSubmit={handleAddSignerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={newSignerName}
                  onChange={(e) => setNewSignerName(e.target.value)}
                  placeholder="e.g. Marie Claire Uwase"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Corporate Role</label>
                <select
                  value={newSignerRole}
                  onChange={(e) => setNewSignerRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="CEO">Chief Executive Officer (CEO)</option>
                  <option value="CFO">Chief Financial Officer (CFO)</option>
                  <option value="CHIEF_RISK_OFFICER">Chief Risk Officer (CRO)</option>
                  <option value="TREASURY_DIRECTOR">Treasury Director</option>
                  <option value="LEGAL_COUNSEL">Head of Legal & Compliance</option>
                  <option value="FINANCE_MANAGER">Senior Finance Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={newSignerEmail}
                  onChange={(e) => setNewSignerEmail(e.target.value)}
                  placeholder="officer@kigalitech.rw"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Phone Number (MoMo / 2FA)</label>
                <input
                  type="text"
                  value={newSignerPhone}
                  onChange={(e) => setNewSignerPhone(e.target.value)}
                  placeholder="+250 788 000 000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Enroll & Generate WebAuthn Key
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewSignerModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Reject Proposal */}
      {rejectingProposalId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-400" />
              <span>Reject Multi-Sig Proposal</span>
            </h3>
            <p className="text-xs text-slate-400">
              Please provide a reason for rejecting proposal <span className="font-mono text-white">{rejectingProposalId}</span>. This reason will be permanently recorded on the governance audit log.
            </p>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs">Rejection Justification</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="e.g. Invoice discrepancy with supplier delivery note"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmRejection}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Confirm Rejection
              </button>
              <button
                type="button"
                onClick={() => setRejectingProposalId(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
