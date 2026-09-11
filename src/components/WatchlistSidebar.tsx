import React, { useState, useEffect } from 'react';
import {
  Star,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Search,
  ArrowUpDown,
  Bell,
  ArrowLeftRight,
  Send,
  Zap,
  RotateCcw,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Wallet
} from 'lucide-react';
import { Asset, WalletAccount } from '../types';

interface WatchlistSidebarProps {
  assets: Asset[];
  wallets: WalletAccount[];
  onOpenSend: (symbol?: string) => void;
  onOpenReceive: (symbol?: string) => void;
  onOpenSwap?: (sourceSymbol?: string) => void;
  onOpenCreatePriceAlert: (symbol?: string) => void;
  className?: string;
}

type SortOption = 'CHANGE_DESC' | 'CHANGE_ASC' | 'HOLDING_DESC' | 'NAME_ASC';

// Helper to generate deterministic synthetic sparkline points for asset
function generateSparklinePoints(currentPrice: number, change24h: number, pointsCount = 12): number[] {
  const points: number[] = [];
  const isPositive = change24h >= 0;
  const startPrice = currentPrice / (1 + change24h / 100);
  
  for (let i = 0; i < pointsCount; i++) {
    const progress = i / (pointsCount - 1);
    // Add realistic market noise
    const noiseSeed = Math.sin((i + 1) * 3.7) * 0.15;
    const trend = (currentPrice - startPrice) * progress;
    let val = startPrice + trend + (currentPrice * noiseSeed * (0.01 + Math.abs(change24h) * 0.002));
    
    // Lock end point to exact current price
    if (i === pointsCount - 1) {
      val = currentPrice;
    }
    points.push(Math.max(val, currentPrice * 0.5));
  }
  return points;
}

// Sparkline SVG Component
const MiniSparkline: React.FC<{
  prices: number[];
  isPositive: boolean;
  height?: number;
  width?: number;
}> = ({ prices, isPositive, height = 36, width = 110 }) => {
  if (!prices || prices.length < 2) return null;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const padding = 3;
  const usableHeight = height - padding * 2;
  const usableWidth = width - padding * 2;

  const pointsString = prices
    .map((price, idx) => {
      const x = padding + (idx / (prices.length - 1)) * usableWidth;
      const y = height - padding - ((price - min) / range) * usableHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const strokeColor = isPositive ? '#10b981' : '#f43f5e'; // emerald-500 or rose-500
  const fillColor = isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';

  const firstX = padding;
  const lastX = padding + usableWidth;
  const bottomY = height - padding;
  const areaString = `${firstX},${bottomY} ${pointsString} ${lastX},${bottomY}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sparkGrad-${isPositive ? 'pos' : 'neg'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.35} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <polygon points={areaString} fill={`url(#sparkGrad-${isPositive ? 'pos' : 'neg'})`} />
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pointsString}
      />
      {/* Pulse dot at last point */}
      {prices.length > 0 && (
        <circle
          cx={(padding + usableWidth).toFixed(1)}
          cy={(height - padding - ((prices[prices.length - 1] - min) / range) * usableHeight).toFixed(1)}
          r="3"
          fill={strokeColor}
          className="animate-pulse"
        />
      )}
    </svg>
  );
};

export const WatchlistSidebar: React.FC<WatchlistSidebarProps> = ({
  assets,
  wallets,
  onOpenSend,
  onOpenReceive,
  onOpenSwap,
  onOpenCreatePriceAlert,
  className = ''
}) => {
  // Pinned Asset Symbols state with localStorage persistence
  const [pinnedSymbols, setPinnedSymbols] = useState<string[]>(() => {
    const saved = localStorage.getItem('kofi_watchlist_symbols');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    // Default initial pinned watchlist assets
    return ['BTC', 'ETH', 'USDT', 'RWF', 'USDC'];
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('CHANGE_DESC');
  const [isCompactView, setIsCompactView] = useState(false);
  const [isLiveUpdating, setIsLiveUpdating] = useState(true);
  const [livePrices, setLivePrices] = useState<Record<string, { price: number; change: number }>>({});
  const [lastTickSymbol, setLastTickSymbol] = useState<string | null>(null);

  // Sync pinned symbols to localStorage
  useEffect(() => {
    localStorage.setItem('kofi_watchlist_symbols', JSON.stringify(pinnedSymbols));
  }, [pinnedSymbols]);

  // Live Simulated Price Ticker Effect
  useEffect(() => {
    if (!isLiveUpdating) return;

    const interval = setInterval(() => {
      if (pinnedSymbols.length === 0) return;
      const randomSymbol = pinnedSymbols[Math.floor(Math.random() * pinnedSymbols.length)];
      const targetAsset = assets.find((a) => a.symbol === randomSymbol);
      if (!targetAsset) return;

      const current = livePrices[randomSymbol]?.price ?? targetAsset.current_price_usd;
      const currentChange = livePrices[randomSymbol]?.change ?? targetAsset.change_24h;

      // Small random price fluctuation (+/- 0.05% to 0.2%)
      const deltaFactor = (Math.random() - 0.49) * 0.003;
      const newPrice = Math.max(0.00001, current * (1 + deltaFactor));
      const newChange = currentChange + deltaFactor * 10;

      setLivePrices((prev) => ({
        ...prev,
        [randomSymbol]: {
          price: newPrice,
          change: newChange
        }
      }));

      setLastTickSymbol(randomSymbol);
      setTimeout(() => setLastTickSymbol(null), 1200);
    }, 3500);

    return () => clearInterval(interval);
  }, [isLiveUpdating, pinnedSymbols, assets, livePrices]);

  // Calculate total net worth for holdings % bar calculation
  const totalUsdNetWorth = wallets.reduce((acc, w) => {
    const a = assets.find((ast) => ast.symbol === w.symbol);
    const p = a ? (livePrices[a.symbol]?.price ?? a.current_price_usd) : 1;
    return acc + w.balance * p;
  }, 0);

  const togglePinSymbol = (symbol: string) => {
    setPinnedSymbols((prev) => {
      if (prev.includes(symbol)) {
        return prev.filter((s) => s !== symbol);
      } else {
        return [...prev, symbol];
      }
    });
  };

  const handlePinAllHeldAssets = () => {
    const heldSymbols = wallets.filter((w) => w.balance > 0).map((w) => w.symbol);
    const merged = Array.from(new Set([...pinnedSymbols, ...heldSymbols]));
    setPinnedSymbols(merged);
  };

  const handleResetDefaultWatchlist = () => {
    setPinnedSymbols(['BTC', 'ETH', 'USDT', 'RWF', 'USDC']);
  };

  // Get pinned asset objects
  const pinnedAssets = pinnedSymbols
    .map((sym) => assets.find((a) => a.symbol === sym))
    .filter((a): a is Asset => a !== undefined);

  // Sorting pinned assets
  const sortedPinnedAssets = [...pinnedAssets].sort((a, b) => {
    const priceA = livePrices[a.symbol]?.price ?? a.current_price_usd;
    const priceB = livePrices[b.symbol]?.price ?? b.current_price_usd;
    const changeA = livePrices[a.symbol]?.change ?? a.change_24h;
    const changeB = livePrices[b.symbol]?.change ?? b.change_24h;

    const walletA = wallets.find((w) => w.symbol === a.symbol);
    const walletB = wallets.find((w) => w.symbol === b.symbol);
    const holdingValA = (walletA?.balance || 0) * priceA;
    const holdingValB = (walletB?.balance || 0) * priceB;

    if (sortBy === 'CHANGE_DESC') return changeB - changeA;
    if (sortBy === 'CHANGE_ASC') return changeA - changeB;
    if (sortBy === 'HOLDING_DESC') return holdingValB - holdingValA;
    if (sortBy === 'NAME_ASC') return a.symbol.localeCompare(b.symbol);
    return 0;
  });

  // Filtered list for search modal
  const filteredSearchAssets = assets.filter(
    (a) =>
      a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 relative flex flex-col justify-between ${className}`}
    >
      {/* Sidebar Header */}
      <div>
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>Asset Watchlist</span>
                <span className="px-2 py-0.2 bg-slate-800 text-amber-400 font-mono text-[10px] font-extrabold rounded-full border border-slate-700">
                  {pinnedSymbols.length}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Live prices & wallet balance trends</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Live Ticker Pulse Indicator */}
            <button
              onClick={() => setIsLiveUpdating(!isLiveUpdating)}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                isLiveUpdating
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
              title={isLiveUpdating ? 'Live ticker streaming active' : 'Live ticker paused'}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isLiveUpdating ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                }`}
              />
              <span>{isLiveUpdating ? 'LIVE' : 'PAUSED'}</span>
            </button>

            {/* Pin New Asset Modal Toggle Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold transition-all shadow-md cursor-pointer flex items-center gap-1 text-xs"
              title="Pin or Add Asset to Watchlist"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">Pin</span>
            </button>
          </div>
        </div>

        {/* Sorting & Customization Control Bar */}
        <div className="flex items-center justify-between gap-2 pt-3 pb-1 text-xs">
          <div className="flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="CHANGE_DESC" className="bg-slate-900">Highest 24h % Gain</option>
              <option value="CHANGE_ASC" className="bg-slate-900">Lowest 24h % Gain</option>
              <option value="HOLDING_DESC" className="bg-slate-900">Highest Holding ($)</option>
              <option value="NAME_ASC" className="bg-slate-900">Asset Name (A-Z)</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCompactView(!isCompactView)}
              className="px-2 py-1 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
              title="Toggle View Mode"
            >
              {isCompactView ? 'Detailed View' : 'Compact'}
            </button>
          </div>
        </div>

        {/* Watchlist Cards List */}
        {sortedPinnedAssets.length === 0 ? (
          <div className="text-center py-8 px-4 bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl my-2 space-y-3">
            <Star className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-xs text-slate-400 font-medium">No assets pinned to Watchlist.</div>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
            >
              Browse & Pin Favorite Assets
            </button>
          </div>
        ) : (
          <div className="space-y-3 mt-2 max-h-[580px] overflow-y-auto pr-1 custom-scrollbar">
            {sortedPinnedAssets.map((asset) => {
              const livePriceData = livePrices[asset.symbol];
              const currentPrice = livePriceData?.price ?? asset.current_price_usd;
              const change24h = livePriceData?.change ?? asset.change_24h;
              const isPositive = change24h >= 0;

              // Find associated wallet account holding
              const wallet = wallets.find((w) => w.symbol === asset.symbol);
              const userBalance = wallet?.balance || 0;
              const holdingValueUsd = userBalance * currentPrice;

              // Calculate % of total net worth
              const portfolioSharePct =
                totalUsdNetWorth > 0 ? ((holdingValueUsd / totalUsdNetWorth) * 100).toFixed(1) : '0.0';

              const sparklinePoints = generateSparklinePoints(currentPrice, change24h);
              const isTicking = lastTickSymbol === asset.symbol;

              return (
                <div
                  key={asset.asset_id}
                  className={`bg-slate-950/80 border rounded-xl p-3.5 space-y-2.5 transition-all duration-300 relative overflow-hidden group ${
                    isTicking
                      ? isPositive
                        ? 'border-emerald-500/60 bg-emerald-950/10 shadow-lg shadow-emerald-500/10 scale-[1.01]'
                        : 'border-rose-500/60 bg-rose-950/10 shadow-lg shadow-rose-500/10 scale-[1.01]'
                      : 'border-slate-800 hover:border-amber-500/40 hover:bg-slate-950'
                  }`}
                >
                  {/* Top Row: Asset Icon, Symbol, Name & Unpin button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-lg shadow-inner shrink-0">
                        {asset.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-white text-xs">{asset.symbol}</span>
                          <span className="text-[10px] text-slate-500 font-medium truncate max-w-[80px]">
                            {asset.name}
                          </span>
                        </div>
                        <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.2 rounded font-mono border border-slate-800">
                          {asset.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Price Change % Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-extrabold flex items-center gap-0.5 border ${
                          isPositive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>
                          {isPositive ? '+' : ''}
                          {change24h.toFixed(2)}%
                        </span>
                      </span>

                      {/* Unpin button */}
                      <button
                        onClick={() => togglePinSymbol(asset.symbol)}
                        className="p-1 text-amber-400 hover:text-slate-500 transition-colors cursor-pointer"
                        title="Unpin from Watchlist"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                      </button>
                    </div>
                  </div>

                  {/* Middle Row: Live Price & Sparkline Chart */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                        Live Price
                      </span>
                      <div className="text-sm font-black font-mono text-white flex items-center gap-1">
                        <span>
                          {asset.symbol === 'RWF'
                            ? `$${currentPrice.toFixed(5)}`
                            : `$${currentPrice.toLocaleString('en-US', {
                                minimumFractionDigits: currentPrice < 1 ? 4 : 2,
                                maximumFractionDigits: currentPrice < 1 ? 4 : 2
                              })}`}
                        </span>
                      </div>
                      {asset.symbol === 'RWF' && (
                        <span className="text-[10px] text-amber-400/80 font-mono block">
                          ≈ 1,380 RWF / USD
                        </span>
                      )}
                    </div>

                    {/* Sparkline Visualizer */}
                    <div className="shrink-0">
                      <MiniSparkline prices={sparklinePoints} isPositive={isPositive} width={isCompactView ? 85 : 110} height={28} />
                    </div>
                  </div>

                  {/* Bottom Row: Wallet Balance Side-by-Side */}
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">My Balance</span>
                        <span className="font-mono text-xs font-bold text-slate-200">
                          {asset.symbol === 'RWF'
                            ? Math.round(userBalance).toLocaleString()
                            : userBalance.toLocaleString('en-US', { maximumFractionDigits: 5 })}{' '}
                          {asset.symbol}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-semibold">Holding Value</span>
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        ${holdingValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      {userBalance > 0 && (
                        <span className="text-[9px] text-slate-500 font-mono block">
                          ({portfolioSharePct}% of wallet)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions Footer (Swap, Send, Alert) */}
                  {!isCompactView && (
                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/60">
                      <button
                        onClick={() => onOpenSwap && onOpenSwap(asset.symbol)}
                        className="flex-1 py-1 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] font-bold rounded-lg border border-slate-800 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        title={`Trade or Swap ${asset.symbol}`}
                      >
                        <ArrowLeftRight className="w-3 h-3 text-sky-400" />
                        <span>Swap</span>
                      </button>

                      <button
                        onClick={() => onOpenSend(asset.symbol)}
                        className="flex-1 py-1 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] font-bold rounded-lg border border-slate-800 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        title={`Send ${asset.symbol}`}
                      >
                        <Send className="w-3 h-3 text-emerald-400" />
                        <span>Send</span>
                      </button>

                      <button
                        onClick={() => onOpenCreatePriceAlert(asset.symbol)}
                        className="py-1 px-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 text-[10px] font-bold rounded-lg border border-slate-800 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        title={`Create Price Alert for ${asset.symbol}`}
                      >
                        <Bell className="w-3 h-3" />
                        <span>Alert</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Quick Controls */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
        <button
          onClick={handlePinAllHeldAssets}
          className="text-amber-400/90 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
        >
          <Sparkles className="w-3 h-3" />
          <span>Pin All Held Assets</span>
        </button>

        <button
          onClick={handleResetDefaultWatchlist}
          className="text-slate-500 hover:text-slate-300 font-medium flex items-center gap-1 cursor-pointer"
          title="Reset to default top 5 assets"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Top 5</span>
        </button>
      </div>

      {/* Search & Pin Asset Selector Modal / Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h3 className="font-extrabold text-white text-sm">Pin Assets to Watchlist</h3>
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search asset symbol or name (e.g. BTC, USDT, RWF)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
                autoFocus
              />
            </div>

            {/* Asset Selection List */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredSearchAssets.map((asset) => {
                const isPinned = pinnedSymbols.includes(asset.symbol);
                const wallet = wallets.find((w) => w.symbol === asset.symbol);
                const userBalance = wallet?.balance || 0;

                return (
                  <div
                    key={asset.asset_id}
                    onClick={() => togglePinSymbol(asset.symbol)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isPinned
                        ? 'bg-amber-500/10 border-amber-500/40 text-white'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-lg">
                        {asset.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white">{asset.symbol}</span>
                          <span className="text-[11px] text-slate-400">{asset.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Price: ${asset.current_price_usd.toLocaleString()} | Balance:{' '}
                          {asset.symbol === 'RWF' ? Math.round(userBalance) : userBalance}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          asset.change_24h >= 0
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {asset.change_24h >= 0 ? '+' : ''}
                        {asset.change_24h}%
                      </span>
                      <button
                        type="button"
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          isPinned
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {isPinned ? <Check className="w-4 h-4 font-bold" /> : <Plus className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">
                {pinnedSymbols.length} assets pinned to sidebar
              </span>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
