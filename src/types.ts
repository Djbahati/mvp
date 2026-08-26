export type AssetType = 'FIAT' | 'CRYPTO' | 'STABLECOIN';

export interface Asset {
  asset_id: string;
  symbol: string;
  name: string;
  type: AssetType;
  network: string;
  decimals: number;
  icon: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'DISABLED';
  deposit_enabled: boolean;
  withdrawal_enabled: boolean;
  exchange_enabled: boolean;
  current_price_usd: number;
  change_24h: number;
  min_deposit: number;
  min_withdrawal: number;
}

export interface WalletAccount {
  account_id: string;
  user_id: string;
  asset_id: string;
  symbol: string;
  balance: number;
  locked_balance: number;
  account_type: 'CUSTOMER' | 'INTERNAL' | 'SUSPENSE' | 'REVENUE' | 'ESCROW';
  address?: string;
  network: string;
}

export type TransactionStatus =
  | 'INITIATED'
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REVERSED'
  | 'REFUNDED';

export type TransactionType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'EXCHANGE'
  | 'P2P_TRANSFER'
  | 'B2B_PAYMENT'
  | 'MERCHANT_PAYOUT'
  | 'MINING_REWARD'
  | 'FEE';

export interface LedgerEntry {
  entry_id: string;
  tx_id: string;
  debit_account_id: string;
  credit_account_id: string;
  debit_account_name: string;
  credit_account_name: string;
  amount: number;
  asset_symbol: string;
  description: string;
  hash: string;
  previous_hash: string;
  created_at: string;
}

export interface Transaction {
  tx_id: string;
  idempotency_key: string;
  tx_type: TransactionType;
  status: TransactionStatus;
  source_wallet: string;
  destination: string;
  amount: number;
  fee: number;
  asset_symbol: string;
  target_asset_symbol?: string;
  target_amount?: number;
  rate?: number;
  provider?: string;
  provider_ref?: string;
  blockchain_tx_hash?: string;
  block_confirmations?: number;
  required_confirmations?: number;
  risk_score?: number;
  compliance_status?: 'APPROVED' | 'FLAGGED' | 'MANUAL_REVIEW';
  created_at: string;
  updated_at: string;
  ledger_entries_count: number;
}

export interface MobileMoneyTransaction {
  id: string;
  provider: 'MTN_RWANDA' | 'AIRTEL_AFRICA' | 'M_PESA_KENYA';
  phone_number: string;
  amount: number;
  currency: 'RWF' | 'KES' | 'UGX';
  direction: 'INBOUND' | 'OUTBOUND';
  status: 'PENDING_USSD' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
  external_ref: string;
  webhook_signature: string;
  timestamp: string;
  reconciled: boolean;
}

export interface ExternalWallet {
  id: string;
  type: 'METAMASK' | 'WALLETCONNECT' | 'PHANTOM' | 'HARDWARE_LEDGER';
  address: string;
  network: string;
  connected_at: string;
  verified: boolean;
}

export interface MultiSigSigner {
  id: string;
  name: string;
  role: 'CEO' | 'CFO' | 'CHIEF_RISK_OFFICER' | 'TREASURY_DIRECTOR' | 'LEGAL_COUNSEL' | 'FINANCE_MANAGER';
  email: string;
  phone: string;
  public_key: string;
  enrolled_webauthn: boolean;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  joined_at: string;
}

export interface MultiSigPolicy {
  id: string;
  name: string;
  description: string;
  required_signatures_n: number;
  total_signers_m: number;
  threshold_amount_usd: number;
  timelock_hours: number;
  allowed_assets: string[];
  auto_execute_on_quorum: boolean;
  is_active: boolean;
}

export interface MultiSigSignature {
  signer_id: string;
  signer_name: string;
  signer_role: string;
  status: 'SIGNED' | 'REJECTED' | 'PENDING';
  signature_hash?: string;
  signed_at?: string;
  biometric_attestation_type?: 'WEBAUTHN_FIDO2' | 'HARDWARE_TOKEN_YUBIKEY' | 'MPC_ENCLAVE';
  rejection_reason?: string;
}

export interface MultiSigProposal {
  id: string;
  policy_id: string;
  title: string;
  description: string;
  amount: number;
  asset_symbol: string;
  usd_equivalent: number;
  destination: string;
  destination_type: 'SUPPLIER_PAYOUT' | 'TREASURY_SWEEP' | 'MOMO_BULK_DISBURSE' | 'CROSS_BORDER_SETTLEMENT' | 'ESCROW_RELEASE';
  initiator_name: string;
  initiator_role: string;
  initiator_id: string;
  required_signatures: number;
  total_signers: number;
  current_signatures_count: number;
  signatures: MultiSigSignature[];
  status: 'PENDING_APPROVALS' | 'QUORUM_REACHED' | 'EXECUTED_TO_LEDGER' | 'REJECTED' | 'EXPIRED';
  created_at: string;
  expires_at: string;
  executed_at?: string;
  ledger_tx_id?: string;
  merkle_proof_hash?: string;
  execution_error?: string;
}

export interface B2BMerchant {
  merchant_id: string;
  name: string;
  registration_no: string;
  kyb_status: 'VERIFIED' | 'UNDER_REVIEW' | 'TIER_3_APPROVED';
  api_keys: ApiKey[];
  webhooks: WebhookConfig[];
  invoices: Invoice[];
  payout_policy: {
    four_eyes_threshold: number; // e.g. amounts > 5000 USD require 2nd approval
    daily_limit: number;
    authorized_roles: string[];
  };
  multisig_signers?: MultiSigSigner[];
  multisig_policies?: MultiSigPolicy[];
  multisig_proposals?: MultiSigProposal[];
}

export interface ApiKey {
  id: string;
  key_name: string;
  public_key: string;
  secret_preview: string;
  environment: 'LIVE' | 'SANDBOX';
  created_at: string;
  last_used_at: string;
  rate_limit_rpm: number;
}

export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  asset_symbol: string;
  description: string;
  status: 'DRAFT' | 'ISSUED' | 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  payment_link_url: string;
  due_date: string;
  created_at: string;
}

export interface MiningWorker {
  worker_id: string;
  worker_name: string;
  algorithm: 'SHA-256 (BTC)' | 'kHeavyHash (KAS)' | 'Scrypt (LTC)';
  hashrate_ths: number;
  shares_accepted: number;
  shares_rejected: number;
  efficiency_percentage: number;
  temperature_c: number;
  power_watts: number;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  last_share_time: string;
}

export interface MiningReward {
  id: string;
  worker_id: string;
  pool_name: string;
  block_height: number;
  coinbase_tx_hash: string;
  reward_amount: number;
  asset_symbol: string;
  confirmations: number;
  verified_on_chain: boolean;
  credited_to_ledger: boolean;
  timestamp: string;
}

export interface KycProfile {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  country: string;
  tier: 1 | 2 | 3;
  tier_name: string;
  daily_limit_usd: number;
  id_document_type: 'PASSPORT' | 'NATIONAL_ID' | 'DRIVERS_LICENSE';
  id_number: string;
  status: 'VERIFIED' | 'PENDING' | 'ACTION_REQUIRED';
  aml_risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  aml_risk_score: number; // 0 to 100
  sanctions_cleared: boolean;
  pep_cleared: boolean;
  last_screened: string;
}

export interface UserProfile {
  user_id: string;
  full_name: string;
  phone_number: string;
  is_phone_linked: boolean;
  momo_operator: 'MTN_RWANDA' | 'AIRTEL_AFRICA';
  momo_pin?: string;
  account_number: string;
  merchant_code: string;
  linked_at?: string;
  total_reward_points: number;
  biometric_enrolled?: boolean;
  biometric_for_high_risk?: boolean;
}

export interface BiometricCredential {
  id: string;
  rawId: string;
  name: string;
  type: string;
  authenticatorAttachment?: 'platform' | 'cross-platform';
  transports?: string[];
  algorithm: number;
  deviceType: string;
  userVerification: 'required' | 'preferred' | 'discouraged';
  createdAt: string;
  lastUsedAt?: string;
  counter?: number;
}

export interface BiometricAssertionProof {
  credentialId: string;
  rawId: string;
  authenticatorDataHex: string;
  clientDataJson: string;
  signatureHex: string;
  userVerified: boolean;
  userPresent: boolean;
  algorithm: string;
  actionTitle: string;
  amount?: number;
  asset?: string;
  destination?: string;
  challenge: string;
  timestamp: string;
  rpId: string;
  authenticatorType: string;
}

export interface HighRiskActionRequest {
  id: string;
  actionType: 'HIGH_VALUE_WITHDRAW' | 'HIGH_VALUE_SEND' | 'FOUR_EYES_PAYOUT' | 'MULTI_SIG_EXECUTE' | 'API_SECRET_REVEAL' | 'MOMO_HIGH_DISBURSE' | 'TEST_AUTH' | 'STEP_UP_AUTH';
  title: string;
  description: string;
  amount?: number;
  asset?: string;
  destination?: string;
  riskScore: number;
  details?: Record<string, any>;
  onSuccess: (proof?: BiometricAssertionProof) => void | Promise<void>;
  onCancel?: () => void;
}

export interface UssdSession {
  session_id: string;
  phone_number: string;
  current_step: string;
  session_data: Record<string, any>;
  history: string[];
}

export interface SystemServiceStatus {
  name: string;
  language: 'Rust' | 'Go' | 'C#' | 'Java' | 'PostgreSQL';
  role: string;
  status: 'HEALTHY' | 'SYNCING' | 'STANDBY';
  latency_ms: number;
  version: string;
  port: number;
  metrics: {
    tps: number;
    memory_mb: number;
    uptime: string;
  };
}
