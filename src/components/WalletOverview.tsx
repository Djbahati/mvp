import React from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  QrCode,
  Plus,
  Shield,
  ExternalLink,
  CheckCircle,
  Clock,
  Coins,
  CreditCard,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Asset, WalletAccount, Transaction, ExternalWallet } from '../types';

interface WalletOverviewProps {
  wallets: WalletAccount[];
  assets: Asset[];
  transactions: Transaction[];
  externalWallets: ExternalWallet[];
  onOpenSend: (symbol?: string) => void;
  onOpenReceive: (symbol?: string) => void;
  onOpenDeposit: (symbol?: string) => void;
  onOpenWithdraw: (symbol?: string) => void;
  onOpenSwap: (sourceSymbol?: string) => void;
  onOpenConnectWallet: () => void;
  onSelectTab: (tab: string) => void;
}

export const WalletOverview: React.FC<WalletOverviewProps> = ({
  wallets,
  assets,
  transactions,
  externalWallets,
  onOpenSend,
  onOpenReceive,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenSwap,
  onOpenConnectWallet,
  onSelectTab
}) => {
  // Calculate total net worth in USD
  const totalUsd = wallets.reduce((acc, w) => {
    const asset = assets.find((a) => a.symbol === w.symbol);
    const price = asset ? asset.current_price_usd : 1;
    return acc + w.balance * price;
  }, 0);

  // RWF equivalent (~1380 RWF per USD)
  const totalRwf = totalUsd / (assets.find((a) => a.symbol === 'RWF')?.current_price_usd || 0.00072);

  const fiatWallets = wallets.filter((w) => {
    const asset = assets.find((a) => a.symbol === w.symbol);
    return asset?.type === 'FIAT';
  });

  const stableWallets = wallets.filter((w) => {
    const asset = assets.find((a) => a.symbol === w.symbol);
    return asset?.type === 'STABLECOIN';
  });

  const cryptoWallets = wallets.filter((w) => {
    const asset = assets.find((a) => a.symbol === w.symbol);
    return asset?.type === 'CRYPTO';
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Net Worth Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Multi-Currency Portfolio
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                Audited by Rust Ledger
              </span>
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                ${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <span className="text-sm font-medium text-slate-400">
                ≈ {Math.round(totalRwf).toLocaleString()} RWF
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400 inline" />
              Protected by MPC HSM Enclave & Double-Entry Accounting
            </p>
          </div>

          {/* Quick Action Button Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onOpenDeposit()}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/10 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Deposit (MoMo / Crypto)</span>
            </button>
            <button
              onClick={() => onOpenWithdraw()}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 text-slate-300" />
              <span>Withdraw</span>
            </button>
            <button
              onClick={() => onOpenSend()}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              <span>Send</span>
            </button>
            <button
              onClick={() => onOpenReceive()}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>Receive / QR</span>
            </button>
            <button
              onClick={() => onOpenSwap()}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4 text-sky-400" />
              <span>Swap / FX</span>
            </button>
          </div>
        </div>
      </div>

      {/* Asset Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Mobile Money & Fiat Wallets */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CreditCard className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-sm">Mobile Money & Fiat</h3>
            </div>
            <span className="text-xs text-slate-400">{fiatWallets.length} Accounts</span>
          </div>

          <div className="space-y-3">
            {fiatWallets.map((w) => {
              const asset = assets.find((a) => a.symbol === w.symbol);
              const valUsd = w.balance * (asset?.current_price_usd || 0);
              return (
                <div
                  key={w.account_id}
                  className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{asset?.icon}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-100 text-sm">{w.symbol}</span>
                        <span className="text-[11px] text-slate-400">({asset?.name})</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate max-w-[140px]">
                        {w.address}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-white text-sm">
                        {w.symbol === 'RWF'
                          ? w.balance.toLocaleString()
                          : w.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        ≈ ${valUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <button
                      onClick={() => onOpenReceive(w.symbol)}
                      title={`Show ${w.symbol} QR Code & Deposit Address`}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 transition-colors cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Stablecoins (USDT & USDC) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                <Coins className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-sm">Stablecoins (1:1 USD)</h3>
            </div>
            <span className="text-xs text-slate-400">{stableWallets.length} Wallets</span>
          </div>

          <div className="space-y-3">
            {stableWallets.map((w) => {
              const asset = assets.find((a) => a.symbol === w.symbol);
              const valUsd = w.balance * (asset?.current_price_usd || 1);
              return (
                <div
                  key={w.account_id}
                  className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{asset?.icon}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-100 text-sm">{w.symbol}</span>
                        <span className="text-[10px] bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded font-mono">
                          {w.network}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate max-w-[130px]" title={w.address}>
                        {w.address?.substring(0, 8)}...{w.address?.substring((w.address?.length || 10) - 6)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-white text-sm">
                        {w.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        ≈ ${valUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <button
                      onClick={() => onOpenReceive(w.symbol)}
                      title={`Show ${w.symbol} QR Code & Deposit Address`}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 transition-colors cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Cryptocurrencies (BTC & ETH) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Wallet className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-sm">Native Cryptocurrency</h3>
            </div>
            <span className="text-xs text-slate-400">{cryptoWallets.length} Assets</span>
          </div>

          <div className="space-y-3">
            {cryptoWallets.map((w) => {
              const asset = assets.find((a) => a.symbol === w.symbol);
              const valUsd = w.balance * (asset?.current_price_usd || 0);
              return (
                <div
                  key={w.account_id}
                  className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{asset?.icon}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-100 text-sm">{w.symbol}</span>
                        <span className="text-[10px] text-emerald-400 font-semibold">
                          ${asset?.current_price_usd.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate max-w-[130px]" title={w.address}>
                        {w.address?.substring(0, 8)}...{w.address?.substring((w.address?.length || 10) - 6)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-white text-sm font-mono">
                        {w.balance.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 })}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        ≈ ${valUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <button
                      onClick={() => onOpenReceive(w.symbol)}
                      title={`Show ${w.symbol} QR Code & Deposit Address`}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 transition-colors cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Non-Custodial External Wallets Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Connected Non-Custodial Web3 Wallets
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure client-side signing (private keys and seed phrases are never stored or transmitted)
            </p>
          </div>
          <button
            onClick={onOpenConnectWallet}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Connect Wallet</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {externalWallets.map((ext) => (
            <div
              key={ext.id}
              className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
                  {ext.type === 'METAMASK' ? '🦊' : '🌐'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200 text-xs">{ext.type}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">
                      {ext.network}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {ext.address.substring(0, 10)}...{ext.address.substring(ext.address.length - 8)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>Verified</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Ledger Transactions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-white text-sm">Recent Ledger Financial Movements</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Idempotent, double-entry logged and cryptographically signed transactions
            </p>
          </div>
          <button
            onClick={() => onSelectTab('ledger')}
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
          >
            <span>Full Ledger Matrix</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3">Transaction</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Route / Provider</th>
                <th className="pb-3">Idempotency & Risk</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transactions.map((tx) => (
                <tr key={tx.tx_id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-3 font-mono">
                    <div className="font-bold text-slate-200">{tx.tx_id}</div>
                    <div className="text-[11px] text-slate-400">
                      {new Date(tx.created_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">
                      {tx.tx_type}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="font-bold text-white">
                      {tx.asset_symbol === 'RWF'
                        ? tx.amount.toLocaleString()
                        : tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                      {tx.asset_symbol}
                    </div>
                    {tx.target_amount && (
                      <div className="text-[11px] text-emerald-400">
                        ➔ {tx.target_amount} {tx.target_asset_symbol}
                      </div>
                    )}
                  </td>
                  <td className="py-3 text-slate-400">
                    <div className="truncate max-w-[200px]" title={tx.source_wallet}>
                      {tx.source_wallet}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                      ➔ {tx.destination}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]" title={tx.idempotency_key}>
                      {tx.idempotency_key}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        Risk Score: {tx.risk_score || 2}/100
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                        tx.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : tx.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {tx.status === 'COMPLETED' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
