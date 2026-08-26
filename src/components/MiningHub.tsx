import React, { useState } from 'react';
import {
  Cpu,
  Activity,
  Zap,
  Flame,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Plus,
  RefreshCw,
  Coins
} from 'lucide-react';
import { MiningWorker, MiningReward } from '../types';

interface MiningHubProps {
  workers: MiningWorker[];
  rewards: MiningReward[];
  onTriggerVerifiedPayout: (reward: MiningReward) => void;
  onMineNewBlock?: () => void;
  onSettleToMoMo?: (rewardId: string) => void;
}

export const MiningHub: React.FC<MiningHubProps> = ({
  workers,
  rewards,
  onTriggerVerifiedPayout,
  onMineNewBlock,
  onSettleToMoMo
}) => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'rewards' | 'calc'>('telemetry');

  // Total Hashrate
  const btcWorkers = workers.filter((w) => w.algorithm.includes('BTC'));
  const totalBtcHashrate = btcWorkers.reduce((acc, w) => acc + w.hashrate_ths, 0);
  const totalPowerWatts = workers.reduce((acc, w) => acc + w.power_watts, 0);

  // Daily yield estimate
  const estDailyBtc = (totalBtcHashrate / 1000) * 0.0058; // approx BTC per day for ~650 TH/s
  const btcPrice = 96450;
  const estDailyUsd = estDailyBtc * btcPrice;
  const powerCostPerDay = (totalPowerWatts * 24 * 0.05) / 1000; // $0.05 per kWh industrial rate
  const netDailyProfitUsd = estDailyUsd - powerCostPerDay;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Cpu className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white">Cryptocurrency Mining & Stratum Telemetry</h2>
              <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded border border-emerald-500/20">
                Verified On-Chain Rewards Only
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Real-time ASIC worker stratum metrics and verified on-chain coinbase block reward settlement. No artificial balances—funds are credited only after required blockchain confirmations.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">Foundry USA Stratum: Connected</span>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs text-slate-400 font-semibold mb-1">Total SHA-256 Hashrate</div>
          <div className="text-2xl font-extrabold text-white font-mono">{totalBtcHashrate.toFixed(1)} TH/s</div>
          <div className="text-[11px] text-emerald-400 font-semibold mt-1">3 Active ASIC Rigs</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs text-slate-400 font-semibold mb-1">Total Power Consumption</div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">{(totalPowerWatts / 1000).toFixed(2)} kW</div>
          <div className="text-[11px] text-slate-400 mt-1">Efficiency: 29.5 J/TH</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs text-slate-400 font-semibold mb-1">Est. 24h Gross Yield</div>
          <div className="text-2xl font-extrabold text-white font-mono">{estDailyBtc.toFixed(5)} BTC</div>
          <div className="text-[11px] text-emerald-400 mt-1">≈ ${estDailyUsd.toFixed(2)} USD</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs text-slate-400 font-semibold mb-1">Est. 24h Net Profit</div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">${netDailyProfitUsd.toFixed(2)}</div>
          <div className="text-[11px] text-slate-400 mt-1">After ${(powerCostPerDay).toFixed(2)} power cost</div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'telemetry' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 bg-slate-900'
          }`}
        >
          Active ASIC Workers ({workers.length})
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'rewards' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 bg-slate-900'
          }`}
        >
          Verified On-Chain Block Rewards ({rewards.length})
        </button>
      </div>

      {/* Tab 1: Worker Telemetry */}
      {activeTab === 'telemetry' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workers.map((w) => (
            <div
              key={w.worker_id}
              className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm">{w.worker_name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{w.algorithm}</div>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {w.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">Hashrate</div>
                  <div className="font-bold text-amber-400 mt-0.5">{w.hashrate_ths} TH/s</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">Temperature</div>
                  <div className="font-bold text-slate-200 mt-0.5">{w.temperature_c}°C</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">Power</div>
                  <div className="font-bold text-slate-200 mt-0.5">{w.power_watts} W</div>
                </div>
              </div>

              <div className="flex justify-between text-xs text-slate-400 pt-1">
                <span>Shares: {w.shares_accepted.toLocaleString()} acc / {w.shares_rejected} rej</span>
                <span className="text-emerald-400 font-semibold">{w.efficiency_percentage}% Efficiency</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Verified Coinbase Rewards */}
      {activeTab === 'rewards' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-white text-sm">Verified Coinbase Block Rewards</h3>
              <p className="text-xs text-slate-400">
                Only real on-chain mined rewards are credited to customer ledger balances after 6+ Bitcoin block confirmations.
              </p>
            </div>

            {onMineNewBlock && (
              <button
                onClick={onMineNewBlock}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Coins className="w-4 h-4" />
                <span>Simulate Block Hit (+0.008 BTC)</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {rewards.map((r) => (
              <div
                key={r.id}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-400">Block #{r.block_height}</span>
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded">
                      {r.confirmations} Block Confirmations
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white mt-1">
                    +{r.reward_amount} {r.asset_symbol} (≈ ${(r.reward_amount * 96450).toFixed(2)})
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 truncate max-w-md">
                    Coinbase TX: {r.coinbase_tx_hash}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Credited to Ledger</span>
                  </div>

                  {onSettleToMoMo && (
                    <button
                      onClick={() => onSettleToMoMo(r.id)}
                      className="px-3 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      title="Convert reward and payout to Mobile Money phone number"
                    >
                      ⚡ Payout to MoMo (*951#)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
