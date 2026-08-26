import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { WalletOverview } from './components/WalletOverview';
import { MobileMoneyGateway } from './components/MobileMoneyGateway';
import { LedgerExplorer } from './components/LedgerExplorer';
import { ExchangeEngine } from './components/ExchangeEngine';
import { B2BPortal } from './components/B2BPortal';
import { MiningHub } from './components/MiningHub';
import { ComplianceKYC } from './components/ComplianceKYC';
import { ApiConsole } from './components/ApiConsole';
import { CodeInspectorModal } from './components/CodeInspectorModal';
import { ActionModals } from './components/ActionModals';
import { UssdSimulatorModal } from './components/UssdSimulatorModal';
import { BiometricAuthModal } from './components/BiometricAuthModal';
import {
  INITIAL_SERVICES,
  INITIAL_ASSETS,
  INITIAL_WALLETS,
  INITIAL_EXTERNAL_WALLETS,
  INITIAL_TRANSACTIONS,
  INITIAL_LEDGER_ENTRIES,
  INITIAL_B2B_MERCHANT,
  INITIAL_MINING_WORKERS,
  INITIAL_MINING_REWARDS,
  INITIAL_KYC_PROFILE,
  INITIAL_MOMO_LOGS
} from './data/initialData';
import {
  WalletAccount,
  ExternalWallet,
  Transaction,
  LedgerEntry,
  B2BMerchant,
  Invoice,
  MiningReward,
  MobileMoneyTransaction,
  UserProfile,
  HighRiskActionRequest,
  BiometricAssertionProof,
  MultiSigProposal,
  MultiSigPolicy,
  MultiSigSigner,
  MultiSigSignature
} from './types';
import { recordDoubleEntry } from './services/ledgerEngine';
import { generateProjectZip, downloadBlob } from './services/exportService';

const INITIAL_USER_PROFILE: UserProfile = {
  user_id: 'usr_kofi_882',
  full_name: 'Peter Bahati',
  phone_number: '0780455033',
  is_phone_linked: true,
  momo_operator: 'MTN_RWANDA',
  momo_pin: '1234',
  account_number: 'RW09928174',
  merchant_code: '95120',
  linked_at: new Date().toISOString(),
  total_reward_points: 1540,
  biometric_enrolled: true,
  biometric_for_high_risk: true
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('wallets');
  const [services] = useState(INITIAL_SERVICES);
  const [assets] = useState(INITIAL_ASSETS);
  const [wallets, setWallets] = useState<WalletAccount[]>(INITIAL_WALLETS);
  const [externalWallets, setExternalWallets] = useState<ExternalWallet[]>(INITIAL_EXTERNAL_WALLETS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>(INITIAL_LEDGER_ENTRIES);
  const [merchant, setMerchant] = useState<B2BMerchant>(INITIAL_B2B_MERCHANT);
  const [miningWorkers] = useState(INITIAL_MINING_WORKERS);
  const [miningRewards, setMiningRewards] = useState<MiningReward[]>(INITIAL_MINING_REWARDS);
  const [kycProfile, setKycProfile] = useState(INITIAL_KYC_PROFILE);
  const [momoLogs, setMomoLogs] = useState<MobileMoneyTransaction[]>(INITIAL_MOMO_LOGS);
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);

  // Modals & Action Sheet State
  const [isCodeInspectorOpen, setIsCodeInspectorOpen] = useState(false);
  const [isUssdModalOpen, setIsUssdModalOpen] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [modalType, setModalType] = useState<'SEND' | 'RECEIVE' | 'DEPOSIT' | 'WITHDRAW' | 'CONNECT_WALLET' | null>(null);
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<string>('USDT');
  const [highRiskBiometricRequest, setHighRiskBiometricRequest] = useState<HighRiskActionRequest | null>(null);

  // Helper to intercept and gate high-risk financial transactions with WebAuthn Biometrics
  const requestBiometricAuth = (
    title: string,
    description: string,
    actionType: HighRiskActionRequest['actionType'],
    details: { amount?: number; asset?: string; destination?: string; riskScore?: number; [key: string]: any },
    onApproved: () => Promise<void> | void
  ) => {
    setHighRiskBiometricRequest({
      id: `req_bio_${Date.now()}`,
      title,
      description,
      actionType,
      amount: details.amount,
      asset: details.asset,
      destination: details.destination,
      riskScore: details.riskScore || 35,
      details,
      onSuccess: () => {
        setHighRiskBiometricRequest(null);
        onApproved();
      },
      onCancel: () => {
        setHighRiskBiometricRequest(null);
      }
    });
  };

  // Compute live Merkle Root from latest ledger entry
  const latestMerkleHash = ledgerEntries.length > 0
    ? ledgerEntries[ledgerEntries.length - 1].hash
    : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  // Handle Full Project ZIP Download
  const handleDownloadZip = async () => {
    setIsDownloadingZip(true);
    try {
      const zipBlob = await generateProjectZip();
      downloadBlob(zipBlob, 'kofi-polyglot-platform.zip');
    } catch (err) {
      console.error('Error generating ZIP:', err);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // 0. USSD *951# Registration & Connection Flow
  const handleRegisterAndLink = (
    name: string,
    phone: string,
    operator: 'MTN_RWANDA' | 'AIRTEL_AFRICA',
    pin: string
  ) => {
    const updatedProfile: UserProfile = {
      ...userProfile,
      full_name: name,
      phone_number: phone,
      is_phone_linked: true,
      momo_operator: operator,
      momo_pin: pin,
      linked_at: new Date().toISOString()
    };

    setUserProfile(updatedProfile);
    setKycProfile((prev) => ({
      ...prev,
      full_name: name,
      phone: `+250 ${phone}`,
      status: 'VERIFIED'
    }));

    // Post Double-Entry Ledger event for Account Provisioning
    const txId = `tx_ussd_reg_${Date.now()}`;
    const newLedger = recordDoubleEntry(
      ledgerEntries,
      txId,
      'acc_sys_onboarding_pool',
      'Kofi USSD Onboarding Pool (*951#)',
      'acc_usr_rwf_101',
      `User RWF Master Wallet (+250 ${phone})`,
      10000,
      'RWF',
      `USSD *951# Account Provisioning Bonus for ${name} (+250 ${phone})`
    );

    setLedgerEntries(newLedger);
    setWallets((prev) =>
      prev.map((w) => (w.symbol === 'RWF' ? { ...w, balance: w.balance + 10000 } : w))
    );
  };

  // 1. Mobile Money Deposit Handler (Web UI or USSD)
  const handleExecuteMoMoDeposit = async (
    provider: 'MTN_RWANDA' | 'AIRTEL_AFRICA',
    phoneNumber: string,
    amount: number,
    autoSwapToUsdt: boolean
  ) => {
    const txId = `tx_momo_${Date.now()}`;
    const now = new Date().toISOString();
    const providerRef = `${provider === 'MTN_RWANDA' ? 'MTN' : 'AIR'}-${Math.floor(100000000 + Math.random() * 900000000)}`;

    const newLog: MobileMoneyTransaction = {
      id: `momo_log_${Date.now()}`,
      provider,
      phone_number: `+250 ${phoneNumber}`,
      amount,
      currency: 'RWF',
      direction: 'INBOUND',
      status: 'SUCCESS',
      external_ref: providerRef,
      webhook_signature: `sha256=${latestMerkleHash.substring(0, 32)}`,
      timestamp: now,
      reconciled: true
    };

    setMomoLogs((prev) => [newLog, ...prev]);

    if (autoSwapToUsdt) {
      // 1 USDT = 1380 RWF
      const usdtAmount = amount / 1380;
      let newLedger = recordDoubleEntry(
        ledgerEntries,
        txId,
        `acc_${provider.toLowerCase()}_clearing`,
        `${provider} Go Gateway Inbound`,
        'acc_sys_fx_liquidity',
        'Kofi FX Liquidity Pool',
        amount,
        'RWF',
        `MoMo Deposit & Auto-Swap from +250 ${phoneNumber}`
      );

      newLedger = recordDoubleEntry(
        newLedger,
        txId,
        'acc_sys_fx_liquidity',
        'Kofi FX Liquidity Pool',
        'acc_usr_usdt',
        'User USDT Wallet',
        usdtAmount,
        'USDT',
        `Auto-Converted ${amount} RWF to ${usdtAmount.toFixed(2)} USDT`
      );

      setLedgerEntries(newLedger);
      setWallets((prev) =>
        prev.map((w) => (w.symbol === 'USDT' ? { ...w, balance: w.balance + usdtAmount } : w))
      );
    } else {
      const newLedger = recordDoubleEntry(
        ledgerEntries,
        txId,
        `acc_${provider.toLowerCase()}_clearing`,
        `${provider} Go Gateway Inbound`,
        'acc_usr_rwf_101',
        'User RWF Wallet',
        amount,
        'RWF',
        `MoMo Deposit from +250 ${phoneNumber} (${provider})`
      );

      setLedgerEntries(newLedger);
      setWallets((prev) =>
        prev.map((w) => (w.symbol === 'RWF' ? { ...w, balance: w.balance + amount } : w))
      );
    }

    const newTx: Transaction = {
      tx_id: txId,
      idempotency_key: `idemp_momo_${Date.now()}`,
      tx_type: 'DEPOSIT',
      status: 'COMPLETED',
      source_wallet: `${provider} (+250 ${phoneNumber})`,
      destination: 'acc_usr_rwf_101',
      amount: amount,
      fee: 0,
      asset_symbol: 'RWF',
      provider: provider,
      provider_ref: providerRef,
      created_at: now,
      updated_at: now,
      ledger_entries_count: autoSwapToUsdt ? 2 : 1,
      compliance_status: 'APPROVED',
      risk_score: 1
    };

    setTransactions((prev) => [newTx, ...prev]);
  };

  // 1b. Mobile Money Outbound Disbursement
  const handleExecuteMoMoWithdraw = async (
    provider: 'MTN_RWANDA' | 'AIRTEL_AFRICA',
    phoneNumber: string,
    amount: number
  ) => {
    const executeWithdrawal = () => {
      const txId = `tx_momo_out_${Date.now()}`;
      const now = new Date().toISOString();
      const providerRef = `${provider === 'MTN_RWANDA' ? 'MTN' : 'AIR'}-OUT-${Math.floor(100000000 + Math.random() * 900000000)}`;

      const newLog: MobileMoneyTransaction = {
        id: `momo_log_${Date.now()}`,
        provider,
        phone_number: `+250 ${phoneNumber}`,
        amount,
        currency: 'RWF',
        direction: 'OUTBOUND',
        status: 'SUCCESS',
        external_ref: providerRef,
        webhook_signature: `sha256=${latestMerkleHash.substring(0, 32)}`,
        timestamp: now,
        reconciled: true
      };

      setMomoLogs((prev) => [newLog, ...prev]);

      const newLedger = recordDoubleEntry(
        ledgerEntries,
        txId,
        'acc_usr_rwf_101',
        'User RWF Wallet',
        `acc_${provider.toLowerCase()}_disburse`,
        `${provider} Outbound Gateway (+250 ${phoneNumber})`,
        amount,
        'RWF',
        `MoMo Payout to +250 ${phoneNumber} via ${provider}`
      );

      setLedgerEntries(newLedger);
      setWallets((prev) =>
        prev.map((w) => (w.symbol === 'RWF' ? { ...w, balance: Math.max(0, w.balance - amount) } : w))
      );

      const newTx: Transaction = {
        tx_id: txId,
        idempotency_key: `idemp_momo_out_${Date.now()}`,
        tx_type: 'WITHDRAWAL',
        status: 'COMPLETED',
        source_wallet: 'User RWF Wallet',
        destination: `${provider} (+250 ${phoneNumber})`,
        amount: amount,
        fee: 0,
        asset_symbol: 'RWF',
        provider: provider,
        provider_ref: providerRef,
        created_at: now,
        updated_at: now,
        ledger_entries_count: 1,
        compliance_status: 'APPROVED',
        risk_score: amount > 500000 ? 5 : 2
      };

      setTransactions((prev) => [newTx, ...prev]);
    };

    if (amount >= 500000) {
      requestBiometricAuth(
        'Authorize High-Value MoMo Disbursement',
        `Disbursing ${amount.toLocaleString()} RWF to +250 ${phoneNumber} via ${provider}.`,
        'MOMO_HIGH_DISBURSE',
        { amount, asset: 'RWF', destination: `+250 ${phoneNumber}` },
        executeWithdrawal
      );
    } else {
      executeWithdrawal();
    }
  };

  // 2. Multi-Currency Instant FX Swap Handler
  const handleExecuteSwap = async (
    fromSymbol: string,
    toSymbol: string,
    fromAmount: number,
    toAmount?: number,
    feeAmount?: number,
    rateVal?: number
  ) => {
    const txId = `tx_swap_${Date.now()}`;
    const now = new Date().toISOString();

    const fromAsset = assets.find((a) => a.symbol === fromSymbol) || assets[0];
    const toAsset = assets.find((a) => a.symbol === toSymbol) || assets[2];
    const rate = rateVal || (fromAsset.current_price_usd / toAsset.current_price_usd);
    const calculatedToAmount = toAmount || (fromAmount * 0.995 * rate);
    const fee = feeAmount || (fromAmount * 0.005);

    // Record Debit Entry (From Asset)
    let updatedLedger = recordDoubleEntry(
      ledgerEntries,
      txId,
      `acc_usr_${fromSymbol.toLowerCase()}`,
      `User ${fromSymbol} Wallet`,
      'acc_sys_fx_liquidity',
      'Kofi FX Liquidity Pool',
      fromAmount,
      fromSymbol,
      `FX Swap: Sold ${fromAmount} ${fromSymbol} for ${toSymbol}`
    );

    // Record Credit Entry (To Asset)
    updatedLedger = recordDoubleEntry(
      updatedLedger,
      txId,
      'acc_sys_fx_liquidity',
      'Kofi FX Liquidity Pool',
      `acc_usr_${toSymbol.toLowerCase()}`,
      `User ${toSymbol} Wallet`,
      calculatedToAmount,
      toSymbol,
      `FX Swap: Purchased ${calculatedToAmount.toFixed(4)} ${toSymbol}`
    );

    const newTx: Transaction = {
      tx_id: txId,
      idempotency_key: `idemp_swap_${Date.now()}`,
      tx_type: 'EXCHANGE',
      status: 'COMPLETED',
      source_wallet: `User ${fromSymbol} Wallet`,
      destination: `User ${toSymbol} Wallet`,
      amount: fromAmount,
      fee: fee,
      asset_symbol: fromSymbol,
      target_asset_symbol: toSymbol,
      target_amount: calculatedToAmount,
      rate: rate,
      created_at: now,
      updated_at: now,
      ledger_entries_count: 2,
      compliance_status: 'APPROVED',
      risk_score: 1
    };

    setTransactions((prev) => [newTx, ...prev]);
    setLedgerEntries(updatedLedger);
    setWallets((prev) =>
      prev.map((w) => {
        if (w.symbol === fromSymbol) return { ...w, balance: Math.max(0, w.balance - fromAmount) };
        if (w.symbol === toSymbol) return { ...w, balance: w.balance + calculatedToAmount };
        return w;
      })
    );
  };

  // 3. Send Payment Handler
  const handleExecuteSend = async (symbol: string, recipient: string, amount: number) => {
    const executeSend = () => {
      const txId = `tx_send_${Date.now()}`;
      const now = new Date().toISOString();
      const newLedger = recordDoubleEntry(
        ledgerEntries,
        txId,
        `acc_usr_${symbol.toLowerCase()}`,
        `User ${symbol} Wallet`,
        'acc_ext_disbursement',
        `External: ${recipient}`,
        amount,
        symbol,
        `Outbound payment to ${recipient}`
      );

      const newTx: Transaction = {
        tx_id: txId,
        idempotency_key: `idemp_send_${Date.now()}`,
        tx_type: 'P2P_TRANSFER',
        status: 'COMPLETED',
        source_wallet: `User ${symbol} Wallet`,
        destination: recipient,
        amount: amount,
        fee: 0,
        asset_symbol: symbol,
        created_at: now,
        updated_at: now,
        ledger_entries_count: 1,
        compliance_status: 'APPROVED',
        risk_score: 3
      };

      setTransactions((prev) => [newTx, ...prev]);
      setLedgerEntries(newLedger);
      setWallets((prev) =>
        prev.map((w) => (w.symbol === symbol ? { ...w, balance: Math.max(0, w.balance - amount) } : w))
      );
    };

    // Evaluate risk threshold for biometric prompt
    const isHighRisk =
      (symbol === 'USDT' || symbol === 'USD' || symbol === 'EUR' || symbol === 'GBP') && amount >= 500 ||
      symbol === 'RWF' && amount >= 500000 ||
      symbol === 'BTC' && amount >= 0.01 ||
      symbol === 'ETH' && amount >= 0.2;

    if (isHighRisk) {
      requestBiometricAuth(
        `High-Risk Transfer Authorization (${amount} ${symbol})`,
        `Outbound cryptographic transfer of ${amount} ${symbol} to ${recipient}.`,
        'HIGH_VALUE_SEND',
        { amount, asset: symbol, destination: recipient },
        executeSend
      );
    } else {
      executeSend();
    }
  };

  // 4. Withdraw Handler
  const handleExecuteWithdraw = async (symbol: string, destination: string, amount: number) => {
    const executeWithdraw = () => {
      const txId = `tx_wd_${Date.now()}`;
      const now = new Date().toISOString();
      const newLedger = recordDoubleEntry(
        ledgerEntries,
        txId,
        `acc_usr_${symbol.toLowerCase()}`,
        `User ${symbol} Wallet`,
        'acc_sys_withdrawal_pool',
        `Withdrawal Destination (${destination})`,
        amount,
        symbol,
        `Withdrawal to ${destination}`
      );

      const newTx: Transaction = {
        tx_id: txId,
        idempotency_key: `idemp_wd_${Date.now()}`,
        tx_type: 'WITHDRAWAL',
        status: 'COMPLETED',
        source_wallet: `User ${symbol} Wallet`,
        destination: destination,
        amount: amount,
        fee: 0,
        asset_symbol: symbol,
        created_at: now,
        updated_at: now,
        ledger_entries_count: 1,
        compliance_status: 'APPROVED',
        risk_score: 4
      };

      setTransactions((prev) => [newTx, ...prev]);
      setLedgerEntries(newLedger);
      setWallets((prev) =>
        prev.map((w) => (w.symbol === symbol ? { ...w, balance: Math.max(0, w.balance - amount) } : w))
      );
    };

    const isHighRisk =
      (symbol === 'USDT' || symbol === 'USD' || symbol === 'EUR' || symbol === 'GBP') && amount >= 500 ||
      symbol === 'RWF' && amount >= 500000 ||
      symbol === 'BTC' && amount >= 0.01 ||
      symbol === 'ETH' && amount >= 0.2;

    if (isHighRisk) {
      requestBiometricAuth(
        `High-Assurance Withdrawal Authorization (${amount} ${symbol})`,
        `Withdrawal of ${amount} ${symbol} to destination address ${destination}.`,
        'HIGH_VALUE_WITHDRAW',
        { amount, asset: symbol, destination },
        executeWithdraw
      );
    } else {
      executeWithdraw();
    }
  };

  // 5. Connect External Non-Custodial Wallet
  const handleConnectExternalWallet = (type: 'METAMASK' | 'WALLETCONNECT' | 'PHANTOM') => {
    const randomHex = Math.random().toString(16).substring(2, 8);
    const newExtWallet: ExternalWallet = {
      id: `ext_wlt_${Date.now()}`,
      type,
      network: type === 'PHANTOM' ? 'Solana Mainnet' : 'Ethereum / Arbitrum',
      address: `0x71c9${randomHex}9281a8b9487c91920ba8`,
      connected_at: new Date().toISOString(),
      verified: true
    };

    setExternalWallets((prev) => [...prev, newExtWallet]);
  };

  // 6. B2B Invoices & API Keys Handlers
  const handleCreateInvoice = (
    newInvData: Omit<Invoice, 'id' | 'created_at' | 'payment_link_url' | 'status'>
  ) => {
    const invId = `inv_${Date.now()}`;
    const createdInvoice: Invoice = {
      ...newInvData,
      id: invId,
      payment_link_url: `https://pay.kofi.tech/checkout/${invId}`,
      status: 'PENDING',
      created_at: new Date().toISOString()
    };

    setMerchant((prev) => ({
      ...prev,
      invoices: [createdInvoice, ...prev.invoices]
    }));
  };

  const handleGenerateApiKey = (keyName: string, env: 'LIVE' | 'SANDBOX') => {
    const prefix = env === 'LIVE' ? 'kofi_live_pk_' : 'kofi_test_pk_';
    const secretPrefix = env === 'LIVE' ? 'kofi_live_sk_' : 'kofi_test_sk_';
    const rand = Math.random().toString(36).substring(2, 14) + Math.random().toString(36).substring(2, 14);

    const newKey = {
      id: `key_${Date.now()}`,
      key_name: keyName,
      public_key: `${prefix}${rand.substring(0, 24)}`,
      secret_preview: `${secretPrefix}${rand.substring(0, 6)}...`,
      environment: env,
      created_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
      rate_limit_rpm: env === 'LIVE' ? 1200 : 300
    };

    setMerchant((prev) => ({
      ...prev,
      api_keys: [newKey, ...prev.api_keys]
    }));
  };

  const handleApproveFourEyesPayout = (payoutId: string) => {
    requestBiometricAuth(
      'Authorize 4-Eyes Enterprise B2B Payout',
      'Dual-Signer cryptographic approval for 14,500 USDT payout to Kigali Grain Millers Ltd.',
      'FOUR_EYES_PAYOUT',
      { amount: 14500, asset: 'USDT', destination: 'Kigali Grain Millers Ltd' },
      () => {
        const txId = `tx_payout_${Date.now()}`;
        const newLedger = recordDoubleEntry(
          ledgerEntries,
          txId,
          'acc_usr_usdt',
          'Merchant USDT Operating Balance',
          'acc_ext_supplier_kigali',
          'Kigali Grain Millers Ltd',
          14500,
          'USDT',
          'Four-Eyes Approved Supplier Payout (DUAL SIGNER BIOMETRIC VERIFIED)'
        );

        setLedgerEntries(newLedger);
      }
    );
  };

  const handlePayInvoice = (invoiceId: string, method: 'MOMO' | 'CRYPTO') => {
    const targetInv = merchant.invoices.find((i) => i.id === invoiceId);
    if (!targetInv) return;

    setMerchant((prev) => ({
      ...prev,
      invoices: prev.invoices.map((i) => (i.id === invoiceId ? { ...i, status: 'PAID' } : i))
    }));

    const txId = `tx_inv_pay_${Date.now()}`;
    const newLedger = recordDoubleEntry(
      ledgerEntries,
      txId,
      method === 'MOMO' ? 'acc_momo_clearing' : 'acc_crypto_customer',
      method === 'MOMO' ? `MoMo Inbound Checkout (*951#)` : `Customer Crypto Web3 Wallet`,
      'acc_merchant_settlement',
      `${merchant.name} (Kofi B2B Operating Account)`,
      targetInv.amount,
      targetInv.asset_symbol,
      `B2B Invoice Payment for ${targetInv.invoice_number} (${targetInv.customer_name})`
    );

    setLedgerEntries(newLedger);
  };

  // Multi-Signature Governance Handlers
  const handleSignMultiSigProposal = (proposalId: string, signerId: string) => {
    setMerchant((prev) => {
      const proposals = prev.multisig_proposals || [];
      const updatedProposals = proposals.map((p) => {
        if (p.id !== proposalId) return p;

        const updatedSignatures: MultiSigSignature[] = p.signatures.map((sig) => {
          if (sig.signer_id === signerId) {
            return {
              ...sig,
              status: 'SIGNED' as const,
              signed_at: new Date().toISOString(),
              signature_hash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
              biometric_attestation_type: 'WEBAUTHN_FIDO2' as const
            };
          }
          return sig;
        });

        const newCount = updatedSignatures.filter((s) => s.status === 'SIGNED').length;
        const reachedQuorum = newCount >= p.required_signatures;

        return {
          ...p,
          signatures: updatedSignatures,
          current_signatures_count: newCount,
          status: (reachedQuorum ? 'QUORUM_REACHED' : 'PENDING_APPROVALS') as MultiSigProposal['status']
        };
      });

      return {
        ...prev,
        multisig_proposals: updatedProposals
      };
    });
  };

  const handleRejectMultiSigProposal = (proposalId: string, signerId: string, reason?: string) => {
    setMerchant((prev) => {
      const proposals = prev.multisig_proposals || [];
      const updatedProposals = proposals.map((p) => {
        if (p.id !== proposalId) return p;

        const updatedSignatures: MultiSigSignature[] = p.signatures.map((sig) => {
          if (sig.signer_id === signerId) {
            return {
              ...sig,
              status: 'REJECTED' as const,
              rejection_reason: reason || 'Risk threshold exceeded'
            };
          }
          return sig;
        });

        return {
          ...p,
          signatures: updatedSignatures,
          status: 'REJECTED' as const,
          execution_error: `Rejected by signer ${signerId}: ${reason || 'Officer dissent'}`
        };
      });

      return {
        ...prev,
        multisig_proposals: updatedProposals
      };
    });
  };

  const handleExecuteMultiSigProposal = (proposalId: string) => {
    const proposal = (merchant.multisig_proposals || []).find((p) => p.id === proposalId);
    if (!proposal) return;

    requestBiometricAuth(
      `Execute Multi-Sig Payout: ${proposal.title}`,
      `Cryptographic ledger settlement for ${proposal.amount.toLocaleString()} ${proposal.asset_symbol} to ${proposal.destination}. Requires ${proposal.required_signatures}-of-${proposal.total_signers} verified signatures.`,
      'MULTI_SIG_EXECUTE',
      {
        proposalId: proposal.id,
        amount: proposal.amount,
        asset: proposal.asset_symbol,
        destination: proposal.destination,
        destinationType: proposal.destination_type,
        quorum: `${proposal.current_signatures_count}/${proposal.required_signatures}`
      },
      () => {
        const txId = `tx_msig_${Date.now()}`;
        const merkleHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

        // 1. Record immutable double-entry ledger settlement
        const newLedger = recordDoubleEntry(
          ledgerEntries,
          txId,
          `acc_merchant_${proposal.asset_symbol.toLowerCase()}`,
          `${merchant.name} (Multi-Sig Vault Account)`,
          `acc_ext_${proposal.destination.substring(0, 12).toLowerCase()}`,
          `${proposal.destination_type} Destination: ${proposal.destination}`,
          proposal.amount,
          proposal.asset_symbol,
          `Multi-Sig Governance Execution (${proposal.required_signatures}/${proposal.total_signers} Quorum): ${proposal.title} [Merkle Proof: ${merkleHash.substring(0, 14)}...]`
        );

        setLedgerEntries(newLedger);

        // 2. Deduct funds from user/merchant wallet balance if matching asset
        setWallets((prev) =>
          prev.map((w) =>
            w.symbol === proposal.asset_symbol
              ? { ...w, balance: Math.max(0, w.balance - proposal.amount) }
              : w
          )
        );

        // 3. Add to transactions list
        const newTx: Transaction = {
          tx_id: txId,
          idempotency_key: `idemp_${txId}`,
          tx_type: 'MERCHANT_PAYOUT',
          status: 'COMPLETED',
          source_wallet: `Merchant Multi-Sig Vault (${proposal.asset_symbol})`,
          destination: proposal.destination,
          amount: proposal.amount,
          fee: 0,
          asset_symbol: proposal.asset_symbol,
          blockchain_tx_hash: merkleHash,
          block_confirmations: 12,
          required_confirmations: 12,
          risk_score: 8,
          compliance_status: 'APPROVED',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ledger_entries_count: 2
        };
        setTransactions((prev) => [newTx, ...prev]);

        // 4. Update Proposal Status in Merchant State
        setMerchant((prev) => {
          const proposals = prev.multisig_proposals || [];
          return {
            ...prev,
            multisig_proposals: proposals.map((p) =>
              p.id === proposalId
                ? {
                    ...p,
                    status: 'EXECUTED_TO_LEDGER' as const,
                    executed_at: new Date().toISOString(),
                    ledger_tx_id: txId,
                    merkle_proof_hash: merkleHash
                  }
                : p
            )
          };
        });
      }
    );
  };

  const handleCreateMultiSigProposal = (
    newProp: Omit<MultiSigProposal, 'id' | 'created_at' | 'expires_at' | 'current_signatures_count' | 'signatures' | 'status'>
  ) => {
    const signers = merchant.multisig_signers || [];
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

    setMerchant((prev) => ({
      ...prev,
      multisig_proposals: [fullProp, ...(prev.multisig_proposals || [])]
    }));
  };

  const handleSaveMultiSigPolicy = (updatedPol: MultiSigPolicy) => {
    setMerchant((prev) => ({
      ...prev,
      multisig_policies: (prev.multisig_policies || []).map((p) =>
        p.id === updatedPol.id ? updatedPol : p
      )
    }));
  };

  const handleAddMultiSigSigner = (
    newSignerData: Omit<MultiSigSigner, 'id' | 'joined_at' | 'enrolled_webauthn'>
  ) => {
    const newSigner: MultiSigSigner = {
      ...newSignerData,
      id: `sgn_${Date.now()}`,
      enrolled_webauthn: true,
      joined_at: new Date().toISOString()
    };

    setMerchant((prev) => ({
      ...prev,
      multisig_signers: [...(prev.multisig_signers || []), newSigner]
    }));
  };

  // 7. Mining Telemetry Handlers
  const handleMineNewBlock = () => {
    const newReward: MiningReward = {
      id: `mrew_${Date.now()}`,
      worker_id: 'wrk_ant_s21_01',
      pool_name: 'Foundry USA Stratum (stratum+tcp://btc.foundrypool.com:3333)',
      block_height: 892150 + Math.floor(Math.random() * 50),
      coinbase_tx_hash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
      reward_amount: 0.00845,
      asset_symbol: 'BTC',
      confirmations: 18,
      verified_on_chain: true,
      credited_to_ledger: true,
      timestamp: new Date().toISOString()
    };

    setMiningRewards((prev) => [newReward, ...prev]);

    const txId = `tx_mined_${Date.now()}`;
    const newLedger = recordDoubleEntry(
      ledgerEntries,
      txId,
      'acc_stratum_pool_foundry',
      'Foundry USA Stratum Coinbase Account',
      'acc_usr_btc_vault',
      'User BTC SegWit Vault',
      0.00845,
      'BTC',
      `On-Chain Verified Block #${newReward.block_height} Coinbase Reward`
    );

    setLedgerEntries(newLedger);
    setWallets((prev) =>
      prev.map((w) => (w.symbol === 'BTC' ? { ...w, balance: +(w.balance + 0.00845).toFixed(5) } : w))
    );
  };

  const handleSettleMiningRewardToMoMo = (rewardId: string) => {
    const reward = miningRewards.find((r) => r.id === rewardId);
    if (!reward) return;

    // Convert 0.00845 BTC to RWF (≈ 1,120,000 RWF)
    const rwfPayout = Math.round(reward.reward_amount * 96450 * 1380);
    const txId = `tx_min_momo_${Date.now()}`;

    const newLedger = recordDoubleEntry(
      ledgerEntries,
      txId,
      'acc_usr_btc_vault',
      'User BTC Vault (Mining Reward Settlement)',
      'acc_momo_disburse_rw',
      `MTN MoMo Disburse (+250 ${userProfile.phone_number})`,
      rwfPayout,
      'RWF',
      `Mining Pool Reward converted to MoMo Cash (+250 ${userProfile.phone_number})`
    );

    setLedgerEntries(newLedger);
    setWallets((prev) =>
      prev.map((w) => (w.symbol === 'RWF' ? { ...w, balance: w.balance + rwfPayout } : w))
    );
  };

  // 8. Manual Journal Entry Posting
  const handlePostJournalEntry = (
    debitAccId: string,
    debitAccName: string,
    creditAccId: string,
    creditAccName: string,
    amount: number,
    assetSymbol: string,
    description: string
  ) => {
    const txId = `tx_manual_${Date.now()}`;
    const newLedger = recordDoubleEntry(
      ledgerEntries,
      txId,
      debitAccId,
      debitAccName,
      creditAccId,
      creditAccName,
      amount,
      assetSymbol,
      description
    );

    setLedgerEntries(newLedger);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navigation & Status */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        services={services}
        merkleRoot={latestMerkleHash}
        userProfile={userProfile}
        onOpenUssdModal={() => setIsUssdModalOpen(true)}
        onOpenCodeInspector={() => setIsCodeInspectorOpen(true)}
        onDownloadZip={handleDownloadZip}
        isDownloading={isDownloadingZip}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'wallets' && (
          <WalletOverview
            wallets={wallets}
            externalWallets={externalWallets}
            transactions={transactions}
            assets={assets}
            onOpenSend={(sym) => {
              setSelectedAssetSymbol(sym || 'USDT');
              setModalType('SEND');
            }}
            onOpenReceive={(sym) => {
              setSelectedAssetSymbol(sym || 'USDT');
              setModalType('RECEIVE');
            }}
            onOpenDeposit={() => setModalType('DEPOSIT')}
            onOpenWithdraw={() => setModalType('WITHDRAW')}
            onConnectWallet={() => setModalType('CONNECT_WALLET')}
          />
        )}

        {activeTab === 'momo' && (
          <MobileMoneyGateway
            userProfile={userProfile}
            onOpenUssdModal={() => setIsUssdModalOpen(true)}
            onExecuteMoMoDeposit={handleExecuteMoMoDeposit}
            onExecuteMoMoWithdraw={handleExecuteMoMoWithdraw}
            momoLogs={momoLogs}
            currentRwfBalance={wallets.find((w) => w.symbol === 'RWF')?.balance || 0}
          />
        )}

        {activeTab === 'ledger' && (
          <LedgerExplorer
            ledgerEntries={ledgerEntries}
            wallets={wallets}
            onPostJournalEntry={handlePostJournalEntry}
          />
        )}

        {activeTab === 'exchange' && (
          <ExchangeEngine
            assets={assets}
            wallets={wallets}
            onExecuteSwap={handleExecuteSwap}
          />
        )}

        {activeTab === 'b2b' && (
          <B2BPortal
            merchant={merchant}
            onCreateInvoice={handleCreateInvoice}
            onGenerateApiKey={handleGenerateApiKey}
            onApproveFourEyesPayout={handleApproveFourEyesPayout}
            onPayInvoice={handlePayInvoice}
            onSignMultiSigProposal={handleSignMultiSigProposal}
            onRejectMultiSigProposal={handleRejectMultiSigProposal}
            onExecuteMultiSigProposal={handleExecuteMultiSigProposal}
            onCreateMultiSigProposal={handleCreateMultiSigProposal}
            onSaveMultiSigPolicy={handleSaveMultiSigPolicy}
            onAddMultiSigSigner={handleAddMultiSigSigner}
          />
        )}

        {activeTab === 'mining' && (
          <MiningHub
            workers={miningWorkers}
            rewards={miningRewards}
            onTriggerVerifiedPayout={() => {}}
            onMineNewBlock={handleMineNewBlock}
            onSettleToMoMo={handleSettleMiningRewardToMoMo}
          />
        )}

        {activeTab === 'compliance' && (
          <ComplianceKYC
            kycProfile={kycProfile}
            onTriggerBiometricTest={(title, details) =>
              requestBiometricAuth(
                title,
                'System-initiated WebAuthn cryptographic hardware test.',
                'STEP_UP_AUTH',
                details,
                () => {}
              )
            }
          />
        )}

        {activeTab === 'api' && <ApiConsole />}
      </main>

      {/* High-Risk Action WebAuthn Biometric Modal */}
      <BiometricAuthModal
        actionRequest={highRiskBiometricRequest}
        onClose={() => setHighRiskBiometricRequest(null)}
      />

      {/* Action Modals (Send, Receive, Deposit, Withdraw, Connect Web3) */}
      <ActionModals
        modalType={modalType}
        onClose={() => setModalType(null)}
        assets={assets}
        wallets={wallets}
        initialSymbol={selectedAssetSymbol}
        onExecuteSend={handleExecuteSend}
        onExecuteWithdraw={handleExecuteWithdraw}
        onConnectExternalWallet={handleConnectExternalWallet}
      />

      {/* USSD Handset Simulator Modal (*951#) */}
      <UssdSimulatorModal
        isOpen={isUssdModalOpen}
        onClose={() => setIsUssdModalOpen(false)}
        userProfile={userProfile}
        wallets={wallets}
        onRegisterAndLink={handleRegisterAndLink}
        onExecuteDeposit={(amount, pin) =>
          handleExecuteMoMoDeposit(userProfile.momo_operator, userProfile.phone_number, amount, false)
        }
        onExecuteWithdraw={(phone, amount, pin) =>
          handleExecuteMoMoWithdraw(userProfile.momo_operator, phone, amount)
        }
        onExecuteSwap={(fromSym, toSym, amount) => handleExecuteSwap(fromSym, toSym, amount)}
        onPayMerchant={(merchantCode, amount) => {
          if (merchant.invoices.length > 0) {
            handlePayInvoice(merchant.invoices[0].id, 'MOMO');
          }
        }}
        onClaimMiningPayout={handleMineNewBlock}
        merkleRoot={latestMerkleHash}
      />

      {/* Full Codebase Inspector Modal */}
      <CodeInspectorModal
        isOpen={isCodeInspectorOpen}
        onClose={() => setIsCodeInspectorOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px]">
          <div>
            Project Kofi • Polyglot Fintech Kernel (Rust Port 5001 • Go Port 5002 • C# Port 5003 • Java Port 8080 • USSD *951#)
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>PostgreSQL: Fixed Precision Numeric(38,18)</span>
            <span>BIP-44 HD Derivation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
