import {
  Asset,
  WalletAccount,
  LedgerEntry,
  Transaction,
  MobileMoneyTransaction,
  ExternalWallet,
  B2BMerchant,
  MiningWorker,
  MiningReward,
  KycProfile,
  SystemServiceStatus
} from '../types';

export const INITIAL_ASSETS: Asset[] = [
  {
    asset_id: 'ast_rwf_001',
    symbol: 'RWF',
    name: 'Rwandan Franc',
    type: 'FIAT',
    network: 'MTN_RW / BK_NET',
    decimals: 0,
    icon: '🇷🇼',
    status: 'ACTIVE',
    deposit_enabled: true,
    withdrawal_enabled: true,
    exchange_enabled: true,
    current_price_usd: 0.00072, // ~1380 RWF per USD
    change_24h: 0.05,
    min_deposit: 500,
    min_withdrawal: 1000
  },
  {
    asset_id: 'ast_usd_002',
    symbol: 'USD',
    name: 'US Dollar',
    type: 'FIAT',
    network: 'FEDWIRE / SWIFT',
    decimals: 2,
    icon: '💵',
    status: 'ACTIVE',
    deposit_enabled: true,
    withdrawal_enabled: true,
    exchange_enabled: true,
    current_price_usd: 1.0,
    change_24h: 0.0,
    min_deposit: 10,
    min_withdrawal: 20
  },
  {
    asset_id: 'ast_usdt_003',
    symbol: 'USDT',
    name: 'Tether USD',
    type: 'STABLECOIN',
    network: 'TRON (TRC-20) / ETH',
    decimals: 6,
    icon: '₮',
    status: 'ACTIVE',
    deposit_enabled: true,
    withdrawal_enabled: true,
    exchange_enabled: true,
    current_price_usd: 1.0002,
    change_24h: 0.02,
    min_deposit: 5,
    min_withdrawal: 10
  },
  {
    asset_id: 'ast_usdc_004',
    symbol: 'USDC',
    name: 'USD Coin',
    type: 'STABLECOIN',
    network: 'POLYGON (PoS)',
    decimals: 6,
    icon: '🪙',
    status: 'ACTIVE',
    deposit_enabled: true,
    withdrawal_enabled: true,
    exchange_enabled: true,
    current_price_usd: 0.9999,
    change_24h: -0.01,
    min_deposit: 5,
    min_withdrawal: 10
  },
  {
    asset_id: 'ast_btc_005',
    symbol: 'BTC',
    name: 'Bitcoin',
    type: 'CRYPTO',
    network: 'BITCOIN_NATIVE_SEGWIT',
    decimals: 8,
    icon: '₿',
    status: 'ACTIVE',
    deposit_enabled: true,
    withdrawal_enabled: true,
    exchange_enabled: true,
    current_price_usd: 96450.0,
    change_24h: 3.42,
    min_deposit: 0.0001,
    min_withdrawal: 0.0005
  },
  {
    asset_id: 'ast_eth_006',
    symbol: 'ETH',
    name: 'Ethereum',
    type: 'CRYPTO',
    network: 'ETHEREUM_MAINNET',
    decimals: 18,
    icon: 'Ξ',
    status: 'ACTIVE',
    deposit_enabled: true,
    withdrawal_enabled: true,
    exchange_enabled: true,
    current_price_usd: 2780.5,
    change_24h: -1.15,
    min_deposit: 0.005,
    min_withdrawal: 0.01
  },
  {
    asset_id: 'ast_eur_007',
    symbol: 'EUR',
    name: 'Euro',
    type: 'FIAT',
    network: 'SEPA_INSTANT',
    decimals: 2,
    icon: '💶',
    status: 'ACTIVE',
    deposit_enabled: true,
    withdrawal_enabled: true,
    exchange_enabled: true,
    current_price_usd: 1.085,
    change_24h: 0.12,
    min_deposit: 10,
    min_withdrawal: 20
  },
  {
    asset_id: 'ast_gbp_008',
    symbol: 'GBP',
    name: 'British Pound',
    type: 'FIAT',
    network: 'UK_FASTER_PAYMENTS / BACS',
    decimals: 2,
    icon: '💷',
    status: 'ACTIVE',
    deposit_enabled: true,
    withdrawal_enabled: true,
    exchange_enabled: true,
    current_price_usd: 1.285,
    change_24h: 0.24,
    min_deposit: 10,
    min_withdrawal: 20
  }
];

export const INITIAL_WALLETS: WalletAccount[] = [
  {
    account_id: 'acc_usr_rwf_101',
    user_id: 'usr_kofi_882',
    asset_id: 'ast_rwf_001',
    symbol: 'RWF',
    balance: 1845000,
    locked_balance: 0,
    account_type: 'CUSTOMER',
    address: '0780455033 (MTN)',
    network: 'MTN_RW'
  },
  {
    account_id: 'acc_usr_usd_102',
    user_id: 'usr_kofi_882',
    asset_id: 'ast_usd_002',
    symbol: 'USD',
    balance: 4250.0,
    locked_balance: 150.0,
    account_type: 'CUSTOMER',
    address: 'US-FED-8849201',
    network: 'FEDWIRE'
  },
  {
    account_id: 'acc_usr_usdt_103',
    user_id: 'usr_kofi_882',
    asset_id: 'ast_usdt_003',
    symbol: 'USDT',
    balance: 3120.45,
    locked_balance: 0,
    account_type: 'CUSTOMER',
    address: 'TGoF8xLq992AkN77V1bKofiTronAddr88',
    network: 'TRON (TRC-20)'
  },
  {
    account_id: 'acc_usr_usdc_104',
    user_id: 'usr_kofi_882',
    asset_id: 'ast_usdc_004',
    symbol: 'USDC',
    balance: 1850.0,
    locked_balance: 0,
    account_type: 'CUSTOMER',
    address: '0x8892AFeB82910cd4E819a7KofiPolygon',
    network: 'POLYGON'
  },
  {
    account_id: 'acc_usr_btc_105',
    user_id: 'usr_kofi_882',
    asset_id: 'ast_btc_005',
    symbol: 'BTC',
    balance: 0.1485203,
    locked_balance: 0,
    account_type: 'CUSTOMER',
    address: 'bc1q9v8k74m2kofi883901ledgerhq982',
    network: 'BITCOIN_SEGWIT'
  },
  {
    account_id: 'acc_usr_eth_106',
    user_id: 'usr_kofi_882',
    asset_id: 'ast_eth_006',
    symbol: 'ETH',
    balance: 1.458,
    locked_balance: 0,
    account_type: 'CUSTOMER',
    address: '0x71C9490184A220d912B98KofiVaultEth',
    network: 'ETHEREUM'
  },
  {
    account_id: 'acc_usr_eur_107',
    user_id: 'usr_kofi_882',
    asset_id: 'ast_eur_007',
    symbol: 'EUR',
    balance: 850.0,
    locked_balance: 0,
    account_type: 'CUSTOMER',
    address: 'EU98KOFI0001928374',
    network: 'SEPA'
  },
  {
    account_id: 'acc_usr_gbp_108',
    user_id: 'usr_kofi_882',
    asset_id: 'ast_gbp_008',
    symbol: 'GBP',
    balance: 620.0,
    locked_balance: 0,
    account_type: 'CUSTOMER',
    address: 'GB29KOFI0001928374',
    network: 'UK_FASTER_PAYMENTS'
  }
];

export const INITIAL_LEDGER: LedgerEntry[] = [
  {
    entry_id: 'ldg_ent_99182',
    tx_id: 'tx_momo_dep_001',
    debit_account_id: 'acc_sys_momo_suspense',
    credit_account_id: 'acc_usr_rwf_101',
    debit_account_name: 'MTN Mobile Money Settlement Pool',
    credit_account_name: 'Customer RWF Wallet',
    amount: 500000,
    asset_symbol: 'RWF',
    description: 'MTN MoMo Deposit #MTN-884920 via Go Connector',
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    previous_hash: '0000000000000000000000000000000000000000000000000000000000000000',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    entry_id: 'ldg_ent_99183',
    tx_id: 'tx_swap_rwf_usdt_002',
    debit_account_id: 'acc_usr_rwf_101',
    credit_account_id: 'acc_sys_fx_liquidity',
    debit_account_name: 'Customer RWF Wallet',
    credit_account_name: 'Internal FX Pool (RWF)',
    amount: 276000,
    asset_symbol: 'RWF',
    description: 'Instant Swap: 276,000 RWF for 200 USDT',
    hash: 'a5892c918302f8194a0e985b191c7816828a211099238bcde981273618491029',
    previous_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    entry_id: 'ldg_ent_99184',
    tx_id: 'tx_swap_rwf_usdt_002',
    debit_account_id: 'acc_sys_fx_liquidity',
    credit_account_id: 'acc_usr_usdt_103',
    debit_account_name: 'Internal FX Pool (USDT)',
    credit_account_name: 'Customer USDT Wallet',
    amount: 200,
    asset_symbol: 'USDT',
    description: 'Credit 200 USDT from swap execution',
    hash: '772b8921a99812f00918bc27736181938b8182736199a0e81726354182910293',
    previous_hash: 'a5892c918302f8194a0e985b191c7816828a211099238bcde981273618491029',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    entry_id: 'ldg_ent_99185',
    tx_id: 'tx_mine_rew_003',
    debit_account_id: 'acc_sys_mining_pool_vault',
    credit_account_id: 'acc_usr_btc_105',
    debit_account_name: 'Foundry USA Stratum Coinbase Vault',
    credit_account_name: 'Customer Bitcoin Wallet',
    amount: 0.00845,
    asset_symbol: 'BTC',
    description: 'Verified Mining Block #892102 Share Reward (12 confirmations)',
    hash: 'c81729019b872615438a098bc191283746199283746591029384756182938475',
    previous_hash: '772b8921a99812f00918bc27736181938b8182736199a0e81726354182910293',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    tx_id: 'tx_momo_dep_001',
    idempotency_key: 'idemp_momo_0780_500k_rwf',
    tx_type: 'DEPOSIT',
    status: 'COMPLETED',
    source_wallet: 'MTN Rwanda (+250 780 455 033)',
    destination: 'Kofi RWF Wallet (acc_usr_rwf_101)',
    amount: 500000,
    fee: 0,
    asset_symbol: 'RWF',
    provider: 'MTN_RWANDA',
    provider_ref: 'MTN-884920199',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    ledger_entries_count: 1,
    compliance_status: 'APPROVED',
    risk_score: 4
  },
  {
    tx_id: 'tx_swap_rwf_usdt_002',
    idempotency_key: 'idemp_swap_rwf_usdt_200',
    tx_type: 'EXCHANGE',
    status: 'COMPLETED',
    source_wallet: 'Kofi RWF Wallet',
    destination: 'Kofi USDT Wallet',
    amount: 276000,
    fee: 1380, // 0.5%
    asset_symbol: 'RWF',
    target_asset_symbol: 'USDT',
    target_amount: 200,
    rate: 1380,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    ledger_entries_count: 2,
    compliance_status: 'APPROVED',
    risk_score: 2
  },
  {
    tx_id: 'tx_mine_rew_003',
    idempotency_key: 'idemp_mine_block_892102_btc',
    tx_type: 'MINING_REWARD',
    status: 'COMPLETED',
    source_wallet: 'Foundry USA Stratum Pool',
    destination: 'Kofi Bitcoin SegWit Wallet',
    amount: 0.00845,
    fee: 0.00005,
    asset_symbol: 'BTC',
    blockchain_tx_hash: '0x3a88fb019c4d928374a819b91739c91028374619028374659102938475618293',
    block_confirmations: 12,
    required_confirmations: 6,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    ledger_entries_count: 1,
    compliance_status: 'APPROVED',
    risk_score: 1
  }
];

export const INITIAL_MOMO_LOGS: MobileMoneyTransaction[] = [
  {
    id: 'momo_log_101',
    provider: 'MTN_RWANDA',
    phone_number: '+250 780 455 033',
    amount: 500000,
    currency: 'RWF',
    direction: 'INBOUND',
    status: 'SUCCESS',
    external_ref: 'MTN-884920199',
    webhook_signature: 'sha256=48f98a287c91920ba87612d8a98f120938475610293847561029384756102938',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    reconciled: true
  },
  {
    id: 'momo_log_102',
    provider: 'AIRTEL_AFRICA',
    phone_number: '+250 730 998 776',
    amount: 150000,
    currency: 'RWF',
    direction: 'OUTBOUND',
    status: 'SUCCESS',
    external_ref: 'AIR-992817263',
    webhook_signature: 'sha256=192847a98b761029384756102938475610293847561029384756102938475610',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    reconciled: true
  }
];

export const INITIAL_EXTERNAL_WALLETS: ExternalWallet[] = [
  {
    id: 'ext_wlt_01',
    type: 'METAMASK',
    address: '0x71C9490184A220d912B989823746190283746182',
    network: 'Ethereum Mainnet',
    connected_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    verified: true
  },
  {
    id: 'ext_wlt_02',
    type: 'WALLETCONNECT',
    address: '0x9928AfeB82910cd4E819a7102938475610293847',
    network: 'Polygon Network',
    connected_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    verified: true
  }
];

export const INITIAL_MERCHANT: B2BMerchant = {
  merchant_id: 'mcht_kofi_ent_991',
  name: 'Kigali Tech Logistics Ltd',
  registration_no: 'RDB-109283741-RW',
  kyb_status: 'TIER_3_APPROVED',
  api_keys: [
    {
      id: 'key_live_01',
      key_name: 'Production E-Commerce Checkout',
      public_key: 'kofi_live_pk_99a81b72c918374619283746',
      secret_preview: 'kofi_live_sk_••••••••9928a',
      environment: 'LIVE',
      created_at: '2026-01-15T10:00:00Z',
      last_used_at: new Date().toISOString(),
      rate_limit_rpm: 1200
    },
    {
      id: 'key_test_02',
      key_name: 'Sandbox Development & QA',
      public_key: 'kofi_test_pk_018273619283746192837461',
      secret_preview: 'kofi_test_sk_••••••••1109f',
      environment: 'SANDBOX',
      created_at: '2026-02-01T12:00:00Z',
      last_used_at: new Date().toISOString(),
      rate_limit_rpm: 300
    }
  ],
  webhooks: [
    {
      id: 'wh_01',
      url: 'https://api.kigalitech.rw/webhooks/kofi-payments',
      events: ['payment.succeeded', 'payout.processed', 'momo.verified'],
      secret: 'whsec_99182736192837461928374619283746',
      active: true
    }
  ],
  invoices: [
    {
      id: 'inv_8821',
      invoice_number: 'INV-2026-0881',
      customer_name: 'East Africa Coffee Exporters',
      customer_email: 'finance@eacoffee.com',
      amount: 4500.0,
      asset_symbol: 'USDT',
      description: 'Bulk cold-storage supply chain tracking & escrow deposit',
      status: 'ISSUED',
      payment_link_url: 'https://pay.kofi.network/inv/8821-ea-coffee',
      due_date: '2026-09-01T00:00:00Z',
      created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'inv_8820',
      invoice_number: 'INV-2026-0880',
      customer_name: 'Nairobi Freight & Rail',
      customer_email: 'accounts@nairobfreight.ke',
      amount: 1850000,
      asset_symbol: 'RWF',
      description: 'Cross-border clearing fees via MTN MoMo B2B',
      status: 'PAID',
      payment_link_url: 'https://pay.kofi.network/inv/8820-nfr-momo',
      due_date: '2026-08-20T00:00:00Z',
      created_at: new Date(Date.now() - 86400000 * 4).toISOString()
    }
  ],
  payout_policy: {
    four_eyes_threshold: 5000, // USD
    daily_limit: 100000,
    authorized_roles: ['FINANCE_DIRECTOR', 'CHIEF_RISK_OFFICER']
  },
  multisig_signers: [
    {
      id: 'sgn_01',
      name: 'Peter Bahati',
      role: 'CEO',
      email: 'bahatipeterbrumbruce@gmail.com',
      phone: '+250 780 455 033',
      public_key: '0x71C9490184A220d912B989823746190283746182',
      enrolled_webauthn: true,
      status: 'ACTIVE',
      joined_at: '2025-11-01T08:00:00Z'
    },
    {
      id: 'sgn_02',
      name: 'Jane Mukamana',
      role: 'CFO',
      email: 'jane.mukamana@kigalitech.rw',
      phone: '+250 788 112 233',
      public_key: '0x48B274F102938475610293847561029384756102',
      enrolled_webauthn: true,
      status: 'ACTIVE',
      joined_at: '2025-11-15T09:30:00Z'
    },
    {
      id: 'sgn_03',
      name: 'Alex Kayiranga',
      role: 'CHIEF_RISK_OFFICER',
      email: 'alex.kayiranga@kigalitech.rw',
      phone: '+250 730 445 566',
      public_key: '0x991AC88192837461928374619283746192837461',
      enrolled_webauthn: true,
      status: 'ACTIVE',
      joined_at: '2025-12-01T11:00:00Z'
    },
    {
      id: 'sgn_04',
      name: 'Diane Umutoni',
      role: 'TREASURY_DIRECTOR',
      email: 'diane.umutoni@kigalitech.rw',
      phone: '+250 782 778 899',
      public_key: '0x11CE44A098237461928374619283746192837461',
      enrolled_webauthn: true,
      status: 'ACTIVE',
      joined_at: '2026-01-10T14:20:00Z'
    }
  ],
  multisig_policies: [
    {
      id: 'pol_3_of_4_treasury',
      name: 'Tier-3 Enterprise Treasury & High-Value Payouts',
      description: 'Requires 3 of 4 board approvals for disbursements and supplier transfers exceeding $10,000 USD or equivalent.',
      required_signatures_n: 3,
      total_signers_m: 4,
      threshold_amount_usd: 10000,
      timelock_hours: 24,
      allowed_assets: ['USDT', 'USDC', 'USD', 'EUR', 'GBP', 'BTC', 'ETH', 'RWF'],
      auto_execute_on_quorum: false,
      is_active: true
    },
    {
      id: 'pol_2_of_3_momo',
      name: 'Mobile Money Bulk Payout Governance',
      description: 'Requires 2 of 3 finance officers for mass MoMo disbursements and payroll exceeding 5,000,000 RWF.',
      required_signatures_n: 2,
      total_signers_m: 3,
      threshold_amount_usd: 3500,
      timelock_hours: 12,
      allowed_assets: ['RWF', 'USDT'],
      auto_execute_on_quorum: true,
      is_active: true
    },
    {
      id: 'pol_2_of_4_ops',
      name: 'Standard Operational Escrow & Payouts',
      description: 'Requires 2 of 4 signatures for operational expenditures and invoices between $2,500 and $9,999 USD.',
      required_signatures_n: 2,
      total_signers_m: 4,
      threshold_amount_usd: 2500,
      timelock_hours: 48,
      allowed_assets: ['USDT', 'USDC', 'USD', 'RWF'],
      auto_execute_on_quorum: true,
      is_active: true
    }
  ],
  multisig_proposals: [
    {
      id: 'msp_2026_0981',
      policy_id: 'pol_3_of_4_treasury',
      title: 'Bulk Grain Supply Settlement: Kigali Grain Millers Ltd',
      description: 'Quarterly agricultural grain procurement and storage warehouse escrow settlement.',
      amount: 25000,
      asset_symbol: 'USDT',
      usd_equivalent: 25000,
      destination: '0x71C9490184A220d912B98KigaliGrainVault',
      destination_type: 'SUPPLIER_PAYOUT',
      initiator_name: 'Jane Mukamana',
      initiator_role: 'CFO',
      initiator_id: 'sgn_02',
      required_signatures: 3,
      total_signers: 4,
      current_signatures_count: 2,
      status: 'PENDING_APPROVALS',
      signatures: [
        {
          signer_id: 'sgn_02',
          signer_name: 'Jane Mukamana',
          signer_role: 'CFO',
          status: 'SIGNED',
          signature_hash: '0x48b274f102938475610293847561029384756102938475610293847561029384',
          signed_at: new Date(Date.now() - 3600000 * 3).toISOString(),
          biometric_attestation_type: 'WEBAUTHN_FIDO2'
        },
        {
          signer_id: 'sgn_01',
          signer_name: 'Peter Bahati',
          signer_role: 'CEO',
          status: 'SIGNED',
          signature_hash: '0x71c9490184a220d912b989823746190283746182938475610293847561029384',
          signed_at: new Date(Date.now() - 3600000 * 1).toISOString(),
          biometric_attestation_type: 'WEBAUTHN_FIDO2'
        },
        {
          signer_id: 'sgn_03',
          signer_name: 'Alex Kayiranga',
          signer_role: 'CHIEF_RISK_OFFICER',
          status: 'PENDING'
        },
        {
          signer_id: 'sgn_04',
          signer_name: 'Diane Umutoni',
          signer_role: 'TREASURY_DIRECTOR',
          status: 'PENDING'
        }
      ],
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      expires_at: new Date(Date.now() + 3600000 * 20).toISOString()
    },
    {
      id: 'msp_2026_0982',
      policy_id: 'pol_2_of_3_momo',
      title: 'MoMo Bulk Tea Farmer Payout (Musanze District Co-op)',
      description: 'Weekly mobile money disbursement to 142 registered cooperative farmers via MTN MoMo bulk push.',
      amount: 18500000,
      asset_symbol: 'RWF',
      usd_equivalent: 13405,
      destination: '+250 788 991 220 (Musanze MoMo Pool)',
      destination_type: 'MOMO_BULK_DISBURSE',
      initiator_name: 'Diane Umutoni',
      initiator_role: 'TREASURY_DIRECTOR',
      initiator_id: 'sgn_04',
      required_signatures: 2,
      total_signers: 3,
      current_signatures_count: 2,
      status: 'QUORUM_REACHED',
      signatures: [
        {
          signer_id: 'sgn_04',
          signer_name: 'Diane Umutoni',
          signer_role: 'TREASURY_DIRECTOR',
          status: 'SIGNED',
          signature_hash: '0x11ce44a098237461928374619283746192837461928374619283746192837461',
          signed_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          biometric_attestation_type: 'WEBAUTHN_FIDO2'
        },
        {
          signer_id: 'sgn_02',
          signer_name: 'Jane Mukamana',
          signer_role: 'CFO',
          status: 'SIGNED',
          signature_hash: '0x48b274f102938475610293847561029384756102938475610293847561029384',
          signed_at: new Date(Date.now() - 1800000).toISOString(),
          biometric_attestation_type: 'WEBAUTHN_FIDO2'
        },
        {
          signer_id: 'sgn_01',
          signer_name: 'Peter Bahati',
          signer_role: 'CEO',
          status: 'PENDING'
        }
      ],
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      expires_at: new Date(Date.now() + 3600000 * 9).toISOString()
    },
    {
      id: 'msp_2026_0980',
      policy_id: 'pol_3_of_4_treasury',
      title: 'Cross-Border Clearing & FX Hedge Reserve',
      description: 'Liquidity sweep to USD treasury account for international vendor SWIFT clearing.',
      amount: 45000,
      asset_symbol: 'USDT',
      usd_equivalent: 45000,
      destination: 'acc_treasury_swift_hedging_09',
      destination_type: 'TREASURY_SWEEP',
      initiator_name: 'Peter Bahati',
      initiator_role: 'CEO',
      initiator_id: 'sgn_01',
      required_signatures: 3,
      total_signers: 4,
      current_signatures_count: 3,
      status: 'EXECUTED_TO_LEDGER',
      signatures: [
        {
          signer_id: 'sgn_01',
          signer_name: 'Peter Bahati',
          signer_role: 'CEO',
          status: 'SIGNED',
          signature_hash: '0x71c9490184a220d912b989823746190283746182938475610293847561029384',
          signed_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          biometric_attestation_type: 'WEBAUTHN_FIDO2'
        },
        {
          signer_id: 'sgn_02',
          signer_name: 'Jane Mukamana',
          signer_role: 'CFO',
          status: 'SIGNED',
          signature_hash: '0x48b274f102938475610293847561029384756102938475610293847561029384',
          signed_at: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString(),
          biometric_attestation_type: 'WEBAUTHN_FIDO2'
        },
        {
          signer_id: 'sgn_03',
          signer_name: 'Alex Kayiranga',
          signer_role: 'CHIEF_RISK_OFFICER',
          status: 'SIGNED',
          signature_hash: '0x991ac88192837461928374619283746192837461928374619283746192837461',
          signed_at: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(),
          biometric_attestation_type: 'WEBAUTHN_FIDO2'
        },
        {
          signer_id: 'sgn_04',
          signer_name: 'Diane Umutoni',
          signer_role: 'TREASURY_DIRECTOR',
          status: 'PENDING'
        }
      ],
      created_at: new Date(Date.now() - 86400000 * 2 - 7200000).toISOString(),
      expires_at: new Date(Date.now() + 86400000 * 2).toISOString(),
      executed_at: new Date(Date.now() - 86400000 * 2 + 3900000).toISOString(),
      ledger_tx_id: 'tx_msig_99281',
      merkle_proof_hash: '0x8f7a2910c8192837465910293847561029384756102938475610293847561029'
    }
  ]
};

export const INITIAL_MINING_WORKERS: MiningWorker[] = [
  {
    worker_id: 'wrk_ant_s21_01',
    worker_name: 'Antminer S21 Pro - Rig 01',
    algorithm: 'SHA-256 (BTC)',
    hashrate_ths: 234.8,
    shares_accepted: 148920,
    shares_rejected: 28,
    efficiency_percentage: 99.98,
    temperature_c: 64.2,
    power_watts: 3510,
    status: 'ONLINE',
    last_share_time: 'Just now'
  },
  {
    worker_id: 'wrk_ant_s21_02',
    worker_name: 'Antminer S21 Pro - Rig 02',
    algorithm: 'SHA-256 (BTC)',
    hashrate_ths: 235.2,
    shares_accepted: 147810,
    shares_rejected: 31,
    efficiency_percentage: 99.97,
    temperature_c: 63.8,
    power_watts: 3505,
    status: 'ONLINE',
    last_share_time: '2s ago'
  },
  {
    worker_id: 'wrk_whats_m60_03',
    worker_name: 'Whatsminer M60S - Rig 03',
    algorithm: 'SHA-256 (BTC)',
    hashrate_ths: 186.4,
    shares_accepted: 112450,
    shares_rejected: 19,
    efficiency_percentage: 99.98,
    temperature_c: 67.5,
    power_watts: 3200,
    status: 'ONLINE',
    last_share_time: '5s ago'
  },
  {
    worker_id: 'wrk_iceriver_ks5_04',
    worker_name: 'IceRiver KS5L - Kaspa',
    algorithm: 'kHeavyHash (KAS)',
    hashrate_ths: 12.0,
    shares_accepted: 89320,
    shares_rejected: 8,
    efficiency_percentage: 99.99,
    temperature_c: 58.1,
    power_watts: 3400,
    status: 'ONLINE',
    last_share_time: '1s ago'
  }
];

export const INITIAL_MINING_REWARDS: MiningReward[] = [
  {
    id: 'mrew_892102',
    worker_id: 'wrk_ant_s21_01',
    pool_name: 'Foundry USA Stratum (stratum+tcp://btc.foundrypool.com:3333)',
    block_height: 892102,
    coinbase_tx_hash: '0x3a88fb019c4d928374a819b91739c91028374619028374659102938475618293',
    reward_amount: 0.00845,
    asset_symbol: 'BTC',
    confirmations: 12,
    verified_on_chain: true,
    credited_to_ledger: true,
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'mrew_892080',
    worker_id: 'wrk_ant_s21_02',
    pool_name: 'Foundry USA Stratum (stratum+tcp://btc.foundrypool.com:3333)',
    block_height: 892080,
    coinbase_tx_hash: '0x77f9810a9c819283746199028374618293847561928374651928374619283746',
    reward_amount: 0.00792,
    asset_symbol: 'BTC',
    confirmations: 34,
    verified_on_chain: true,
    credited_to_ledger: true,
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString()
  }
];

export const INITIAL_KYC_PROFILE: KycProfile = {
  user_id: 'usr_kofi_882',
  full_name: 'Peter Bahati',
  email: 'bahatipeterbrumbruce@gmail.com',
  phone: '+250780455033',
  country: 'Rwanda (RWA)',
  tier: 3,
  tier_name: 'Tier 3 (Institutional / Enhanced Due Diligence)',
  daily_limit_usd: 250000,
  id_document_type: 'PASSPORT',
  id_number: 'PC-9928174-RW',
  status: 'VERIFIED',
  aml_risk_level: 'LOW',
  aml_risk_score: 6,
  sanctions_cleared: true,
  pep_cleared: true,
  last_screened: new Date().toISOString()
};

export const INITIAL_SERVICES: SystemServiceStatus[] = [
  {
    name: 'kofi-ledger',
    language: 'Rust',
    role: 'Core Immutable Double-Entry Ledger & Cryptographic Signer',
    status: 'HEALTHY',
    latency_ms: 0.4,
    version: 'v2.4.1-axum',
    port: 5001,
    metrics: {
      tps: 18450,
      memory_mb: 24.6,
      uptime: '99.999%'
    }
  },
  {
    name: 'kofi-connector',
    language: 'Go',
    role: 'Mobile Money (MTN/Airtel) & Blockchain RPC Gateway',
    status: 'HEALTHY',
    latency_ms: 1.2,
    version: 'v1.18.0-gin',
    port: 5002,
    metrics: {
      tps: 12200,
      memory_mb: 32.1,
      uptime: '99.995%'
    }
  },
  {
    name: 'kofi-business',
    language: 'C#',
    role: 'B2B Merchant Policies, 4-Eyes Approvals & Fee Calculation',
    status: 'HEALTHY',
    latency_ms: 2.1,
    version: 'v8.0.2-dotnet',
    port: 5003,
    metrics: {
      tps: 8400,
      memory_mb: 68.4,
      uptime: '99.998%'
    }
  },
  {
    name: 'kofi-api',
    language: 'Java',
    role: 'Public Spring Boot 3 API Gateway, OAuth2, Rate Limiter & Orchestrator',
    status: 'HEALTHY',
    latency_ms: 3.5,
    version: 'v3.2.4-spring',
    port: 8080,
    metrics: {
      tps: 15600,
      memory_mb: 145.2,
      uptime: '99.999%'
    }
  },
  {
    name: 'kofi-db',
    language: 'PostgreSQL',
    role: 'ACID Relational Storage (Fixed-precision NUMERIC 38,18)',
    status: 'HEALTHY',
    latency_ms: 0.8,
    version: 'PostgreSQL 16.2',
    port: 5432,
    metrics: {
      tps: 22000,
      memory_mb: 512.0,
      uptime: '99.999%'
    }
  }
];

export const INITIAL_LEDGER_ENTRIES = INITIAL_LEDGER;
export const INITIAL_B2B_MERCHANT = INITIAL_MERCHANT;
