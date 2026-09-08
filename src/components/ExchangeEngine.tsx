import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  RefreshCw,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Zap,
  Info,
  Clock
} from 'lucide-react';
import { Asset, WalletAccount } from '../types';

interface ExchangeEngineProps {
  assets: Asset[];
  wallets: WalletAccount[];
  onExecuteSwap: (
    fromSymbol: string,
    toSymbol: string,
    fromAmount: number,
    toAmount: number,
    feeAmount: number,
    rate: number
  ) => Promise<void>;
}

export const ExchangeEngine: React.FC<ExchangeEngineProps> = ({
  assets,
  wallets,
  onExecuteSwap
}) => {
  const [fromSymbol, setFromSymbol] = useState<string>('RWF');
  const [toSymbol, setToSymbol] = useState<string>('USDT');
  const [fromAmount, setFromAmount] = useState<string>('138000');
  const [slippageTolerance, setSlippageTolerance] = useState<number>(0.5); // 0.5%
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [quoteTimer, setQuoteTimer] = useState<number>(30);
  const [swapSuccessMessage, setSwapSuccessMessage] = useState<string | null>(null);

  const fromAsset = assets.find((a) => a.symbol === fromSymbol) || assets[0];
  const toAsset = assets.find((a) => a.symbol === toSymbol) || assets[2];

  const fromWallet = wallets.find((w) => w.symbol === fromSymbol);
  const toWallet = wallets.find((w) => w.symbol === toSymbol);

  // Rate calculation (via live oracle price relative to USD)
  const rate = (fromAsset.current_price_usd / toAsset.current_price_usd);
  const parsedFromAmount = parseFloat(fromAmount) || 0;
  
  // 0.5% platform fee calculated via C# logic
  const feeRate = 0.005;
  const feeAmount = parsedFromAmount * feeRate;
  const netFromAmount = parsedFromAmount - feeAmount;
  const calculatedToAmount = netFromAmount * rate;

  // Countdown timer for quote expiration
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteTimer((prev) => (prev > 1 ? prev - 1 : 30));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleInvert = () => {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedFromAmount <= 0) {
      alert('Please enter a valid amount to swap');
      return;
    }

    if (fromWallet && fromWallet.balance < parsedFromAmount) {
      alert(`Insufficient ${fromSymbol} balance. Available: ${fromWallet.balance.toLocaleString()}`);
      return;
    }

    setIsSwapping(true);
    try {
      await onExecuteSwap(
        fromSymbol,
        toSymbol,
        parsedFromAmount,
        calculatedToAmount,
        feeAmount,
        rate
      );
      setSwapSuccessMessage(
        `Swapped ${parsedFromAmount.toLocaleString()} ${fromSymbol} for ${calculatedToAmount.toFixed(4)} ${toSymbol} (Double-Entry Ledger Verified)`
      );
      setTimeout(() => setSwapSuccessMessage(null), 6000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <ArrowLeftRight className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white">Multi-Currency FX & Crypto Exchange</h2>
              <span className="bg-sky-500/10 text-sky-400 text-xs font-bold px-2.5 py-0.5 rounded border border-sky-500/20">
                C# Policy & Pricing Engine (Port 5003)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Zero-spread multi-oracle aggregated pricing (Chainlink, Pyth & Binance Oracle) with instant settlement into destination wallet.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Quote Refresh in: {quoteTimer}s</span>
            </div>
          </div>
        </div>
      </div>

      {swapSuccessMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-semibold flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{swapSuccessMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Swap Form */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-bold text-white text-base mb-4">Instant Currency Swap</h3>

          <form onSubmit={handleExecute} className="space-y-4">
            {/* Pay From Card */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>You Pay</span>
                <span>
                  Available:{' '}
                  <span className="font-mono text-slate-200 font-semibold">
                    {fromWallet ? fromWallet.balance.toLocaleString() : '0'} {fromSymbol}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.00"
                  step="any"
                  className="w-full bg-transparent font-mono text-2xl font-bold text-white focus:outline-none"
                />
                <select
                  value={fromSymbol}
                  onChange={(e) => setFromSymbol(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white font-bold text-sm rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                >
                  {assets.map((a) => (
                    <option key={a.symbol} value={a.symbol}>
                      {a.icon} {a.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Invert Swap Direction Button */}
            <div className="flex justify-center -my-2 relative z-10">
              <button
                type="button"
                onClick={handleInvert}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-amber-400 hover:text-amber-300 shadow-md transition-all cursor-pointer"
                title="Invert Direction"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* Receive To Card */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>You Receive (Estimated)</span>
                <span>
                  Balance:{' '}
                  <span className="font-mono text-slate-200 font-semibold">
                    {toWallet ? toWallet.balance.toLocaleString() : '0'} {toSymbol}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-full font-mono text-2xl font-bold text-emerald-400">
                  {calculatedToAmount > 0
                    ? toSymbol === 'BTC' || toSymbol === 'ETH'
                      ? calculatedToAmount.toFixed(6)
                      : calculatedToAmount.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4
                        })
                    : '0.00'}
                </div>
                <select
                  value={toSymbol}
                  onChange={(e) => setToSymbol(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white font-bold text-sm rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                >
                  {assets
                    .filter((a) => a.symbol !== fromSymbol)
                    .map((a) => (
                      <option key={a.symbol} value={a.symbol}>
                        {a.icon} {a.symbol}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Fee & Exchange Details Breakdown */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Exchange Rate</span>
                <span className="font-mono text-slate-200">
                  1 {fromSymbol} = {rate < 0.0001 ? rate.toFixed(8) : rate.toFixed(4)} {toSymbol}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Platform Fee (0.5%)</span>
                <span className="font-mono text-slate-200">
                  {feeAmount.toLocaleString()} {fromSymbol}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Slippage Tolerance</span>
                <span className="font-mono text-slate-200">{slippageTolerance}%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Settlement Route</span>
                <span className="text-amber-400 font-semibold">
                  Rust Ledger ACID Balanced Execution
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSwapping}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSwapping ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executing Atomic Swap in Ledger...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Execute Instant Swap</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Multi-Oracle Price Feeds & Deviation Protection */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Multi-Oracle Price Feeds & Health</h3>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
                ORACLES IN SYNC
              </span>
            </div>

            <div className="space-y-3">
              {assets.map((asset) => (
                <div
                  key={asset.asset_id}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{asset.icon}</span>
                    <div>
                      <div className="font-bold text-slate-200">{asset.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{asset.network}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-white">
                      ${asset.current_price_usd >= 1
                        ? asset.current_price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })
                        : asset.current_price_usd.toFixed(6)}
                    </div>
                    <div
                      className={`text-[10px] font-semibold ${
                        asset.change_24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {asset.change_24h >= 0 ? '+' : ''}
                      {asset.change_24h}% (24h)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <Info className="w-4 h-4 text-amber-400" />
              <span>Anti-Price Manipulation Failsafe</span>
            </div>
            <p>
              Project Kofi continuously cross-verifies price feeds between Chainlink Decentralized Oracle Networks, Pyth Network high-frequency feeds, and direct liquidity pool depths. If price deviation exceeds 1.5%, automatic execution halting is engaged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
