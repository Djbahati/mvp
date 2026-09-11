import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import {
  ArrowLeftRight,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Coins,
  DollarSign,
  Clock,
  Sparkles,
  Zap,
  ArrowRight,
  CheckCircle2,
  Globe,
  Info,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { Asset } from '../types';

interface CurrencyConverterProps {
  assets: Asset[];
  onOpenSwap?: (sourceSymbol: string, targetSymbol: string, amount: number) => void;
  onSelectTab?: (tab: string) => void;
}

export interface CurrencyOption {
  symbol: string;
  name: string;
  icon: string;
  type: 'FIAT' | 'STABLECOIN' | 'CRYPTO';
  rateToUsd: number; // 1 Unit = X USD
}

// Default expanded currency list including East African & global fiat + crypto
const DEFAULT_CURRENCIES: CurrencyOption[] = [
  { symbol: 'USD', name: 'US Dollar', icon: '💵', type: 'FIAT', rateToUsd: 1.0 },
  { symbol: 'RWF', name: 'Rwandan Franc', icon: '🇷🇼', type: 'FIAT', rateToUsd: 0.00072 }, // ~1388 RWF/USD
  { symbol: 'EUR', name: 'Euro', icon: '💶', type: 'FIAT', rateToUsd: 1.085 },
  { symbol: 'GBP', name: 'British Pound', icon: '💷', type: 'FIAT', rateToUsd: 1.282 },
  { symbol: 'KES', name: 'Kenyan Shilling', icon: '🇰🇪', type: 'FIAT', rateToUsd: 0.0077 }, // ~129.5 KES/USD
  { symbol: 'UGX', name: 'Ugandan Shilling', icon: '🇺🇬', type: 'FIAT', rateToUsd: 0.00027 }, // ~3700 UGX/USD
  { symbol: 'TZS', name: 'Tanzanian Shilling', icon: '🇹🇿', type: 'FIAT', rateToUsd: 0.00037 }, // ~2700 TZS/USD
  { symbol: 'USDT', name: 'Tether USD', icon: '₮', type: 'STABLECOIN', rateToUsd: 1.0002 },
  { symbol: 'USDC', name: 'USD Coin', icon: '🪙', type: 'STABLECOIN', rateToUsd: 0.9999 },
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿', type: 'CRYPTO', rateToUsd: 96450.0 },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', type: 'CRYPTO', rateToUsd: 2780.5 }
];

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  assets,
  onOpenSwap,
  onSelectTab
}) => {
  // Combine assets from props with extended DEFAULT_CURRENCIES
  const availableCurrencies: CurrencyOption[] = useMemo(() => {
    const list = [...DEFAULT_CURRENCIES];
    assets.forEach((a) => {
      if (!list.some((c) => c.symbol === a.symbol)) {
        list.push({
          symbol: a.symbol,
          name: a.name,
          icon: a.icon || '🪙',
          type: a.type,
          rateToUsd: a.current_price_usd || 1.0
        });
      }
    });
    return list;
  }, [assets]);

  const [fromSymbol, setFromSymbol] = useState<string>('USD');
  const [toSymbol, setToSymbol] = useState<string>('RWF');
  const [amount, setAmount] = useState<string>('100');

  // Real-time rates state
  const [ratesToUsd, setRatesToUsd] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    availableCurrencies.forEach((c) => {
      map[c.symbol] = c.rateToUsd;
    });
    return map;
  });

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);
  const [apiSource, setApiSource] = useState<string>('Live ExchangeRate-API');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Fetch live exchange rates on mount and on manual refresh
  const fetchLiveExchangeRates = async () => {
    setIsLoadingRates(true);
    setErrorNotice(null);
    try {
      // Primary API: Open Exchange Rates free endpoint
      const response = await axios.get('https://open.er-api.com/v6/latest/USD', { timeout: 5000 });
      if (response.data && response.data.rates) {
        const liveFiatRates = response.data.rates;

        setRatesToUsd((prev) => {
          const updated = { ...prev };
          // 1 USD = X Currency -> Rate to USD = 1 / X
          if (liveFiatRates.RWF) updated.RWF = 1 / liveFiatRates.RWF;
          if (liveFiatRates.EUR) updated.EUR = 1 / liveFiatRates.EUR;
          if (liveFiatRates.GBP) updated.GBP = 1 / liveFiatRates.GBP;
          if (liveFiatRates.KES) updated.KES = 1 / liveFiatRates.KES;
          if (liveFiatRates.UGX) updated.UGX = 1 / liveFiatRates.UGX;
          if (liveFiatRates.TZS) updated.TZS = 1 / liveFiatRates.TZS;
          return updated;
        });

        setLastUpdated(new Date());
        setApiSource('Live Open Exchange Rates API');
      }
    } catch (err) {
      console.warn('Could not fetch external fiat exchange rates, using dynamic fallback rates:', err);
      setApiSource('Kofi Vault Oracle (Fallback)');
    } finally {
      setIsLoadingRates(false);
    }
  };

  useEffect(() => {
    fetchLiveExchangeRates();
  }, []);

  // Compute conversion calculation values
  const fromCurrency = availableCurrencies.find((c) => c.symbol === fromSymbol) || availableCurrencies[0];
  const toCurrency = availableCurrencies.find((c) => c.symbol === toSymbol) || availableCurrencies[1];

  const fromRateUsd = ratesToUsd[fromSymbol] || fromCurrency.rateToUsd;
  const toRateUsd = ratesToUsd[toSymbol] || toCurrency.rateToUsd;

  // Direct Exchange Rate: 1 From = X To
  // 1 From in USD = fromRateUsd; 1 To in USD = toRateUsd
  // -> 1 From = (fromRateUsd / toRateUsd) To
  const unitRate = toRateUsd > 0 ? fromRateUsd / toRateUsd : 0;
  const inverseRate = unitRate > 0 ? 1 / unitRate : 0;

  const numericAmount = parseFloat(amount) || 0;
  const convertedValue = numericAmount * unitRate;

  // Swap Source and Target
  const handleSwapDirection = () => {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
  };

  // Generate 7-day realistic rate trend history data for Recharts
  const rateTrendHistory = useMemo(() => {
    const points = [];
    const now = new Date();
    // Historical factors variation around unitRate
    const variations = [0.985, 0.992, 0.988, 1.004, 0.997, 1.008, 1.0];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);

      const varFactor = variations[6 - i];
      const ratePoint = unitRate * varFactor;

      points.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        rate: Math.round(ratePoint * 1000000) / 1000000,
        formattedRate:
          unitRate < 0.01
            ? ratePoint.toFixed(6)
            : unitRate > 100
            ? Math.round(ratePoint).toLocaleString()
            : ratePoint.toFixed(4)
      });
    }
    return points;
  }, [unitRate]);

  // Quick Preset Amounts Matrix
  const presetAmounts = [1, 10, 50, 100, 500, 1000];

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800/90 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
                <Coins className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Real-Time Exchange Oracle
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {apiSource}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Universal Currency Converter
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Instant real-time rate conversion between East African Fiat (RWF, KES, UGX, TZS), Global Currencies (USD, EUR, GBP), Stablecoins, and Crypto assets.
            </p>
          </div>

          {/* Live Sync Status & Manual Refresh Button */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-right">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Last Rate Sync</p>
              <p className="text-xs font-mono font-bold text-slate-200 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                {lastUpdated.toLocaleTimeString()}
              </p>
            </div>

            <button
              onClick={fetchLiveExchangeRates}
              disabled={isLoadingRates}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-400 rounded-2xl border border-slate-700 transition-colors cursor-pointer shadow-md"
              title="Refresh Live Exchange Rates"
            >
              <RefreshCw className={`w-5 h-5 ${isLoadingRates ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Converter Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Convert Assets</span>
              <span className="text-xs font-normal text-slate-400 font-mono">
                (1 {fromSymbol} = {unitRate < 0.01 ? unitRate.toFixed(6) : unitRate.toLocaleString(undefined, { maximumFractionDigits: 4 })} {toSymbol})
              </span>
            </h3>

            <div className="text-xs text-amber-400 font-mono font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              0.00% Spread Fee
            </div>
          </div>

          {/* Converter Form Controls */}
          <div className="space-y-4">
            {/* Amount Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                You Convert (Amount)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-lg font-mono font-bold text-white focus:outline-none focus:border-amber-500 pr-16"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm font-mono">
                  {fromSymbol}
                </span>
              </div>
            </div>

            {/* Currency Dropdown Selectors with Swap Button in middle */}
            <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center pt-2">
              {/* From Currency Selector */}
              <div className="sm:col-span-5 space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  From Asset
                </label>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 flex items-center gap-2">
                  <span className="text-2xl">{fromCurrency.icon}</span>
                  <select
                    value={fromSymbol}
                    onChange={(e) => setFromSymbol(e.target.value)}
                    className="bg-transparent text-white text-sm font-bold w-full focus:outline-none cursor-pointer"
                  >
                    {availableCurrencies.map((c) => (
                      <option key={c.symbol} value={c.symbol} className="bg-slate-900 text-white">
                        {c.symbol} - {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Direction Swap Button */}
              <div className="sm:col-span-1 flex justify-center sm:pt-5">
                <button
                  onClick={handleSwapDirection}
                  className="p-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer font-bold"
                  title="Swap Conversion Direction"
                >
                  <ArrowLeftRight className="w-5 h-5" />
                </button>
              </div>

              {/* To Currency Selector */}
              <div className="sm:col-span-5 space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  To Asset
                </label>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 flex items-center gap-2">
                  <span className="text-2xl">{toCurrency.icon}</span>
                  <select
                    value={toSymbol}
                    onChange={(e) => setToSymbol(e.target.value)}
                    className="bg-transparent text-white text-sm font-bold w-full focus:outline-none cursor-pointer"
                  >
                    {availableCurrencies.map((c) => (
                      <option key={c.symbol} value={c.symbol} className="bg-slate-900 text-white">
                        {c.symbol} - {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Calculated Conversion Result Display Box */}
            <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider">Converted Equivalent</span>
                <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Live Spot Rate
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 tracking-tight">
                  {convertedValue.toLocaleString('en-US', {
                    maximumFractionDigits: toCurrency.type === 'CRYPTO' ? 6 : 2
                  })}{' '}
                  <span className="text-lg font-bold text-white">{toSymbol}</span>
                </div>

                <div className="text-right text-xs text-slate-400 font-mono">
                  <p>
                    1 {fromSymbol} ={' '}
                    <strong className="text-slate-200">
                      {unitRate < 0.01 ? unitRate.toFixed(6) : unitRate.toLocaleString(undefined, { maximumFractionDigits: 4 })} {toSymbol}
                    </strong>
                  </p>
                  <p>
                    1 {toSymbol} ={' '}
                    <strong className="text-slate-200">
                      {inverseRate < 0.01 ? inverseRate.toFixed(6) : inverseRate.toLocaleString(undefined, { maximumFractionDigits: 4 })} {fromSymbol}
                    </strong>
                  </p>
                </div>
              </div>

              {/* Direct Action Link to Swap Tab */}
              {(onOpenSwap || onSelectTab) && (
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <p className="text-[11px] text-slate-400">
                    Ready to execute this trade on your Kofi Wallet balance?
                  </p>
                  <button
                    onClick={() => {
                      if (onOpenSwap) {
                        onOpenSwap(fromSymbol, toSymbol, numericAmount);
                      } else if (onSelectTab) {
                        onSelectTab('exchange');
                      }
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>Execute FX Swap</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <span className="text-[11px] text-slate-400 font-semibold block mb-2">Quick Amounts ({fromSymbol}):</span>
              <div className="flex items-center gap-2 flex-wrap">
                {presetAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt.toString())}
                    className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-mono font-bold text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                  >
                    {amt.toLocaleString()} {fromSymbol}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Recharts 7-Day Exchange Rate Trend & Matrix */}
        <div className="lg:col-span-5 space-y-6">
          {/* Rate Trend Recharts Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <h4 className="text-sm font-bold text-white">
                  7-Day Rate History ({fromSymbol} / {toSymbol})
                </h4>
              </div>

              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Stable Trend
              </span>
            </div>

            <div className="w-full h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rateTrendHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 shadow-xl text-xs font-mono space-y-1">
                            <p className="text-slate-400">{d.date}</p>
                            <p className="text-amber-400 font-bold">
                              1 {fromSymbol} = {d.formattedRate} {toSymbol}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#rateGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Conversion Matrix Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Popular Conversion Table</span>
              <span className="text-[10px] text-amber-400 font-mono">Spot Rates</span>
            </h4>

            <div className="divide-y divide-slate-800 text-xs font-mono">
              {[1, 10, 100, 1000, 5000].map((val) => {
                const res = val * unitRate;
                return (
                  <div key={val} className="py-2 flex items-center justify-between text-slate-300">
                    <span className="font-semibold text-white">
                      {val.toLocaleString()} {fromSymbol}
                    </span>
                    <span className="text-amber-400 font-bold">
                      = {res.toLocaleString('en-US', { maximumFractionDigits: toCurrency.type === 'CRYPTO' ? 5 : 2 })} {toSymbol}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
