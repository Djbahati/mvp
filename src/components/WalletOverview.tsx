import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  QrCode,
  Plus,
  Shield,
  CheckCircle,
  Clock,
  Coins,
  CreditCard,
  Layers,
  ChevronRight,
  Camera,
  Zap,
  Bell,
  BellRing,
  Trash2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Smartphone,
  Mail,
  AlertTriangle,
  Play,
  CalendarCheck,
  Star
} from 'lucide-react';
import { Asset, WalletAccount, Transaction, ExternalWallet, LedgerEntry, QuickRecipient, PriceAlert, SubscriptionRule } from '../types';
import { EmptyState } from './EmptyState';
import { QuickSendWidget } from './QuickSendWidget';
import { BalanceTrendChart } from './BalanceTrendChart';
import { SubscriptionManager } from './SubscriptionManager';
import { WatchlistSidebar } from './WatchlistSidebar';

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
}

const RippleButton: React.FC<{
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
  title?: string;
  rippleColor?: string;
}> = ({ onClick, className = '', children, title, rippleColor = 'bg-white/35' }) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple: Ripple = {
      x,
      y,
      size,
      id: Date.now() + Math.random(),
    };

    setRipples((prev) => [...prev, newRipple]);
    if (onClick) onClick();
  };

  const removeRipple = (id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <button
      onClick={handleClick}
      title={title}
      className={`relative overflow-hidden cursor-pointer transition-transform active:scale-95 ${className}`}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          onAnimationEnd={() => removeRipple(ripple.id)}
          className={`absolute rounded-full pointer-events-none animate-ripple ${rippleColor}`}
          style={{
            top: ripple.y,
            left: ripple.x,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
      <span className="relative z-10 flex items-center gap-1.5">{children}</span>
    </button>
  );
};

interface WalletOverviewProps {
  wallets: WalletAccount[];
  assets: Asset[];
  transactions: Transaction[];
  ledgerEntries: LedgerEntry[];
  externalWallets: ExternalWallet[];
  quickRecipients: QuickRecipient[];
  priceAlerts: PriceAlert[];
  subscriptions?: SubscriptionRule[];
  onAddSubscription?: (rule: Omit<SubscriptionRule, 'id' | 'createdAt'>) => void;
  onUpdateSubscription?: (updatedRule: SubscriptionRule) => void;
  onDeleteSubscription?: (id: string) => void;
  onToggleSubscription?: (id: string) => void;
  onOpenSend: (symbol?: string) => void;
  onOpenReceive: (symbol?: string) => void;
  onOpenDeposit: (symbol?: string) => void;
  onOpenWithdraw: (symbol?: string) => void;
  onOpenSwap?: (sourceSymbol?: string) => void;
  onOpenConnectWallet: () => void;
  onSelectTab: (tab: string) => void;
  onOpenQrScanner: () => void;
  onSelectRecipientToSend: (recipient: QuickRecipient) => void;
  onAddQuickRecipient: (newRecipient: Omit<QuickRecipient, 'id'>) => void;
  onDeleteQuickRecipient: (id: string) => void;
  onToggleQuickFavorite: (id: string) => void;
  onOpenCreatePriceAlert: (symbol?: string) => void;
  onTogglePriceAlert: (id: string) => void;
  onDeletePriceAlert: (id: string) => void;
  onSimulateTriggerAlert: (id: string) => void;
}

export type SecondaryCurrencyCode = 'EUR' | 'GBP' | 'KES';

/**
 * Helper function to calculate and format total portfolio value in a selected secondary currency
 */
export function formatSecondaryCurrencyValue(
  totalUsd: number,
  currency: SecondaryCurrencyCode,
  assets: Asset[]
): { value: string; symbol: string; label: string; rate: number } {
  const rates: Record<SecondaryCurrencyCode, { rate: number; symbol: string; label: string }> = {
    EUR: { rate: 0.92, symbol: '€', label: 'Euros' },
    GBP: { rate: 0.78, symbol: '£', label: 'Pounds' },
    KES: { rate: 129.5, symbol: 'KSh', label: 'Kenyan Shillings' }
  };

  const config = rates[currency] || rates.EUR;
  const converted = totalUsd * config.rate;

  const formatted =
    currency === 'EUR' || currency === 'GBP'
      ? `${config.symbol}${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `${config.symbol} ${Math.round(converted).toLocaleString()}`;

  return {
    value: formatted,
    symbol: config.symbol,
    label: config.label,
    rate: config.rate
  };
}

export const WalletOverview: React.FC<WalletOverviewProps> = ({
  wallets,
  assets,
  transactions,
  ledgerEntries,
  externalWallets,
  quickRecipients,
  priceAlerts = [],
  subscriptions = [],
  onAddSubscription,
  onUpdateSubscription,
  onDeleteSubscription,
  onToggleSubscription,
  onOpenSend,
  onOpenReceive,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenSwap,
  onOpenConnectWallet,
  onSelectTab,
  onOpenQrScanner,
  onSelectRecipientToSend,
  onAddQuickRecipient,
  onDeleteQuickRecipient,
  onToggleQuickFavorite,
  onOpenCreatePriceAlert,
  onTogglePriceAlert,
  onDeletePriceAlert,
  onSimulateTriggerAlert
}) => {
  const [overviewSubTab, setOverviewSubTab] = useState<'ASSETS' | 'SUBSCRIPTIONS' | 'ALERTS' | 'LEDGER'>('ASSETS');
  const [secondaryCurrency, setSecondaryCurrency] = useState<SecondaryCurrencyCode>('EUR');

  // Calculate total net worth in USD
  const totalUsd = wallets.reduce((acc, w) => {
    const asset = assets.find((a) => a.symbol === w.symbol);
    const price = asset ? asset.current_price_usd : 1;
    return acc + w.balance * price;
  }, 0);

  // RWF equivalent (~1380 RWF per USD)
  const totalRwf = totalUsd / (assets.find((a) => a.symbol === 'RWF')?.current_price_usd || 0.00072);

  // Secondary currency helper execution
  const secondaryFx = formatSecondaryCurrencyValue(totalUsd, secondaryCurrency, assets);

  return (
    <div className="space-y-6">
      {/* Top Banner / Net Worth Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-amber-500/40">
        <div className="absolute -right-12 -top-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Multi-Currency Portfolio
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                Audited by Rust Ledger
              </span>
            </div>

            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono text-white tracking-tight drop-shadow-sm">
                ${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <span className="text-sm sm:text-base font-bold text-amber-400/90 font-mono">
                ≈ {Math.round(totalRwf).toLocaleString()} RWF
              </span>

              {/* Secondary Currency Togglable Badge */}
              <div className="inline-flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-xl p-1 text-xs">
                <span className="font-mono font-bold text-sky-400 px-1.5 py-0.5">
                  ≈ {secondaryFx.value}
                </span>

                <div className="flex items-center gap-0.5 border-l border-slate-800 pl-1">
                  {(['EUR', 'GBP', 'KES'] as SecondaryCurrencyCode[]).map((code) => (
                    <button
                      key={code}
                      onClick={() => setSecondaryCurrency(code)}
                      className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded transition-colors cursor-pointer ${
                        secondaryCurrency === code
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title={`Display in ${code}`}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400 inline" />
              Protected by MPC HSM Enclave & Double-Entry Accounting
            </p>
          </div>

          {/* Quick Action Button Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <RippleButton
              onClick={() => onOpenDeposit()}
              rippleColor="bg-slate-950/40"
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/10"
            >
              <Plus className="w-4 h-4" />
              <span>Deposit (MoMo / Crypto)</span>
            </RippleButton>
            <RippleButton
              onClick={() => onOpenWithdraw()}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs rounded-xl border border-slate-700"
            >
              <ArrowUpRight className="w-4 h-4 text-slate-300" />
              <span>Withdraw</span>
            </RippleButton>
            <RippleButton
              onClick={() => onOpenSend()}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs rounded-xl border border-slate-700"
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              <span>Send</span>
            </RippleButton>
            <RippleButton
              onClick={() => onOpenQrScanner()}
              className="px-3.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs rounded-xl border border-emerald-500/30 shadow-lg shadow-emerald-500/5"
              title="Open camera to scan QR codes"
            >
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>Scan QR Code</span>
            </RippleButton>
            <RippleButton
              onClick={() => onOpenReceive()}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs rounded-xl border border-slate-700"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>Receive / QR</span>
            </RippleButton>
            <RippleButton
              onClick={() => (onOpenSwap ? onOpenSwap() : onSelectTab('exchange'))}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs rounded-xl border border-slate-700"
            >
              <ArrowLeftRight className="w-4 h-4 text-sky-400" />
              <span>Swap / FX</span>
            </RippleButton>
          </div>
        </div>
      </div>

      {/* 30-Day Wallet Balance History Line Chart (Recharts) */}
      <BalanceTrendChart wallets={wallets} assets={assets} />

      {/* Quick Send Frequent Recipients Widget */}
      <QuickSendWidget
        recipients={quickRecipients}
        assets={assets}
        onSelectRecipientToSend={onSelectRecipientToSend}
        onAddRecipient={onAddQuickRecipient}
        onDeleteRecipient={onDeleteQuickRecipient}
        onToggleFavorite={onToggleQuickFavorite}
      />

      {/* Sub-Navigation Bar inside Wallet Overview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setOverviewSubTab('ASSETS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              overviewSubTab === 'ASSETS'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-md shadow-amber-500/5'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Asset Balances & Web3</span>
          </button>

          <button
            onClick={() => setOverviewSubTab('SUBSCRIPTIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              overviewSubTab === 'SUBSCRIPTIONS'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-md shadow-amber-500/5'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <CalendarCheck className="w-4 h-4 text-amber-400" />
            <span>Manage Subscriptions</span>
            <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[10px] font-mono rounded-full font-bold">
              {subscriptions.length}
            </span>
          </button>

          <button
            onClick={() => setOverviewSubTab('ALERTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              overviewSubTab === 'ALERTS'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-md shadow-amber-500/5'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Price Threshold Alerts</span>
            <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[10px] font-mono rounded-full font-bold">
              {priceAlerts.length}
            </span>
          </button>

          <button
            onClick={() => setOverviewSubTab('LEDGER')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              overviewSubTab === 'LEDGER'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-md shadow-amber-500/5'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Clock className="w-4 h-4 text-sky-400" />
            <span>Ledger Activity</span>
          </button>
        </div>

        {overviewSubTab === 'ALERTS' && (
          <button
            onClick={() => onOpenCreatePriceAlert()}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Set New Price Alert</span>
          </button>
        )}
      </div>

      {/* VIEW 0: MANAGE SUBSCRIPTIONS & RECURRING RULES TAB */}
      {overviewSubTab === 'SUBSCRIPTIONS' && (
        <SubscriptionManager
          subscriptions={subscriptions}
          assets={assets}
          onAddSubscription={(rule) => onAddSubscription && onAddSubscription(rule)}
          onUpdateSubscription={(rule) => onUpdateSubscription && onUpdateSubscription(rule)}
          onDeleteSubscription={(id) => onDeleteSubscription && onDeleteSubscription(id)}
          onToggleSubscription={(id) => onToggleSubscription && onToggleSubscription(id)}
        />
      )}

      {/* VIEW 1: PRICE THRESHOLD ALERTS MANAGER TAB */}
      {overviewSubTab === 'ALERTS' && (
        <div className="space-y-4">
          {/* Summary Metrics Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs font-medium">Configured Alert Rules</span>
                <div className="text-xl font-bold text-white font-mono mt-0.5">{priceAlerts.length}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                <Bell className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs font-medium">Active Monitoring</span>
                <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
                  {priceAlerts.filter((a) => a.isEnabled).length}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs font-medium">Triggered Breaches</span>
                <div className="text-xl font-bold text-rose-400 font-mono mt-0.5">
                  {priceAlerts.filter((a) => a.isTriggered).length}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Price Alerts Card Grid */}
          {priceAlerts.length === 0 ? (
            <EmptyState
              title="No Price Alerts Set"
              description="Configure custom price threshold alerts for Bitcoin, USDT, Ethereum, or Rwandan Franc to get notified via SMS or Push whenever target levels are breached."
              actionLabel="Create First Price Alert"
              onAction={() => onOpenCreatePriceAlert()}
              className="p-8 bg-slate-900/60 border border-slate-800 rounded-2xl"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {priceAlerts.map((alert) => {
                const asset = assets.find((a) => a.symbol === alert.assetSymbol);
                const currentPrice = asset ? asset.current_price_usd : 0;
                const priceDiffPct = currentPrice > 0
                  ? (((alert.targetPriceUsd - currentPrice) / currentPrice) * 100).toFixed(2)
                  : '0.00';

                return (
                  <div
                    key={alert.id}
                    className={`bg-slate-900 border rounded-2xl p-4 space-y-3 transition-all relative overflow-hidden ${
                      alert.isTriggered
                        ? 'border-rose-500/50 bg-rose-950/10 shadow-lg shadow-rose-500/5'
                        : alert.isEnabled
                        ? 'border-slate-800 hover:border-amber-500/40'
                        : 'border-slate-800/60 opacity-60'
                    }`}
                  >
                    {/* Header: Asset Icon & Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xl shadow-inner">
                          {asset?.icon || '🪙'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white text-sm">{alert.assetSymbol}</span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono border flex items-center gap-1 ${
                                alert.condition === 'ABOVE'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              {alert.condition === 'ABOVE' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              <span>{alert.condition === 'ABOVE' ? 'Rises Above (>)' : 'Drops Below (<)'}</span>
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">{asset?.name || alert.assetSymbol}</span>
                        </div>
                      </div>

                      {/* Controls: Toggle & Delete */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSimulateTriggerAlert(alert.id)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer"
                          title="Simulate market price trigger"
                        >
                          <Play className="w-3 h-3 text-amber-400" />
                          <span>Test</span>
                        </button>
                        <button
                          onClick={() => onTogglePriceAlert(alert.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            alert.isEnabled
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {alert.isEnabled ? 'ON' : 'OFF'}
                        </button>
                        <button
                          onClick={() => onDeletePriceAlert(alert.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete Price Alert"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Target Price vs Current Price Display */}
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Target Threshold</span>
                        <span className="font-mono text-base font-extrabold text-amber-400">
                          ${alert.targetPriceUsd.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Live Price</span>
                        <span className="font-mono text-sm font-bold text-white">
                          ${currentPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Distance Proximity Indicator */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>Distance to trigger</span>
                        <span className={parseFloat(priceDiffPct) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {parseFloat(priceDiffPct) >= 0 ? `+${priceDiffPct}%` : `${priceDiffPct}%`}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all ${
                            alert.isTriggered
                              ? 'bg-rose-500'
                              : alert.condition === 'ABOVE'
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                          }`}
                          style={{
                            width: `${Math.min(100, Math.max(10, 100 - Math.abs(parseFloat(priceDiffPct))))}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Footer: Notification Channel & Trigger Timestamp */}
                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-800/60">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                        {alert.notificationType === 'SMS' && <Smartphone className="w-3.5 h-3.5 text-amber-400" />}
                        {alert.notificationType === 'EMAIL' && <Mail className="w-3.5 h-3.5 text-sky-400" />}
                        {(alert.notificationType === 'PUSH' || alert.notificationType === 'IN_APP') && (
                          <Bell className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span>{alert.notificationType}</span>
                        {alert.phoneNumberOrEmail && (
                          <span className="text-[10px] text-slate-500 font-mono">({alert.phoneNumberOrEmail})</span>
                        )}
                      </div>

                      {alert.isTriggered ? (
                        <span className="text-rose-400 font-bold flex items-center gap-1 text-[10px] bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Triggered</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">
                          Set {new Date(alert.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {alert.note && (
                      <p className="text-[11px] text-slate-400 italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
                        "{alert.note}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: ASSET BALANCES, WATCHLIST SIDEBAR & WEB3 TAB */}
      {(overviewSubTab === 'ASSETS' || overviewSubTab === 'LEDGER') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Content Column */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Primary Wallet Assets Breakdown Cards */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-amber-400" />
                    <span>My Wallet Asset Balances</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live balance values, network breakdown, and quick transaction controls
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenDeposit()}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Deposit</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {wallets.map((wallet) => {
                  const asset = assets.find((a) => a.symbol === wallet.symbol);
                  const priceUsd = asset ? asset.current_price_usd : 1;
                  const valueUsd = wallet.balance * priceUsd;
                  const change24h = asset ? asset.change_24h : 0;
                  const isPositive = change24h >= 0;

                  return (
                    <div
                      key={wallet.account_id}
                      className="bg-slate-950/80 border border-slate-800/80 hover:border-amber-500/40 p-4 rounded-xl space-y-3 transition-all relative overflow-hidden group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl shadow-inner">
                            {asset?.icon || '🪙'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-white text-sm">{wallet.symbol}</span>
                              <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.2 rounded font-mono border border-slate-800">
                                {wallet.network}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">{asset?.name || wallet.symbol}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${
                              isPositive
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}
                          >
                            {isPositive ? '+' : ''}{change24h}%
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold block uppercase">Account Balance</span>
                          <span className="font-mono text-base font-extrabold text-white">
                            {wallet.symbol === 'RWF'
                              ? Math.round(wallet.balance).toLocaleString()
                              : wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 5 })}{' '}
                            <span className="text-xs font-normal text-amber-400">{wallet.symbol}</span>
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 font-semibold block uppercase">USD Value</span>
                          <span className="font-mono text-sm font-bold text-emerald-400">
                            ${valueUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 pt-1">
                        <button
                          onClick={() => onOpenSend(wallet.symbol)}
                          className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-lg border border-slate-800 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Send</span>
                        </button>
                        <button
                          onClick={() => onOpenReceive(wallet.symbol)}
                          className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-lg border border-slate-800 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5 text-amber-400" />
                          <span>Receive</span>
                        </button>
                        <button
                          onClick={() => onOpenSwap && onOpenSwap(wallet.symbol)}
                          className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-lg border border-slate-800 flex items-center justify-center gap-1 cursor-pointer"
                          title="Swap asset"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5 text-sky-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
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

              {externalWallets.length === 0 ? (
                <EmptyState
                  title="No External Wallets Connected"
                  description="Connect a non-custodial Web3 wallet, hardware device, or banking API to manage external liquidity directly from this dashboard."
                  actionLabel="Connect Wallet Now"
                  onAction={onOpenConnectWallet}
                  className="my-2 p-6"
                />
              ) : (
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
              )}
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

          {/* Watchlist Sidebar Right Column */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-6">
            <WatchlistSidebar
              assets={assets}
              wallets={wallets}
              onOpenSend={onOpenSend}
              onOpenReceive={onOpenReceive}
              onOpenSwap={onOpenSwap}
              onOpenCreatePriceAlert={onOpenCreatePriceAlert}
            />
          </div>
        </div>
      )}
    </div>
  );
};
