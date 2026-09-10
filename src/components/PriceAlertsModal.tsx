import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  TrendingUp,
  TrendingDown,
  Smartphone,
  Mail,
  Zap,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Plus
} from 'lucide-react';
import { Asset, PriceAlert } from '../types';

interface PriceAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  onAddAlert: (newAlert: Omit<PriceAlert, 'id' | 'createdAt' | 'isTriggered'>) => void;
  initialSymbol?: string;
}

export const PriceAlertsModal: React.FC<PriceAlertsModalProps> = ({
  isOpen,
  onClose,
  assets,
  onAddAlert,
  initialSymbol = 'BTC'
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(initialSymbol);
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [notificationType, setNotificationType] = useState<'IN_APP' | 'SMS' | 'PUSH' | 'EMAIL'>('SMS');
  const [contactInfo, setContactInfo] = useState<string>('0780455033');
  const [note, setNote] = useState<string>('');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const selectedAsset = assets.find((a) => a.symbol === selectedSymbol) || assets[0];

  useEffect(() => {
    if (initialSymbol) {
      setSelectedSymbol(initialSymbol);
    }
  }, [initialSymbol]);

  useEffect(() => {
    if (selectedAsset) {
      // Default initial target price near current price
      const current = selectedAsset.current_price_usd;
      const initialTarget = condition === 'ABOVE' ? current * 1.05 : current * 0.95;
      setTargetPrice(initialTarget > 1 ? initialTarget.toFixed(2) : initialTarget.toFixed(6));
    }
  }, [selectedSymbol, condition]);

  if (!isOpen) return null;

  const handleApplyPercentage = (pct: number) => {
    if (!selectedAsset) return;
    const calc = selectedAsset.current_price_usd * (1 + pct / 100);
    setTargetPrice(calc > 1 ? calc.toFixed(2) : calc.toFixed(6));
    if (pct > 0) setCondition('ABOVE');
    if (pct < 0) setCondition('BELOW');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(targetPrice);
    if (isNaN(numPrice) || numPrice <= 0) {
      alert('Please enter a valid positive target price');
      return;
    }

    onAddAlert({
      assetSymbol: selectedSymbol,
      targetPriceUsd: numPrice,
      condition,
      notificationType,
      phoneNumberOrEmail: contactInfo,
      note: note.trim() || undefined,
      isEnabled: true
    });

    setSuccessBanner(`Price alert set for ${selectedSymbol} when price goes ${condition.toLowerCase()} $${numPrice.toLocaleString()}`);
    setTimeout(() => {
      setSuccessBanner(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Set Custom Price Alert</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-semibold border border-emerald-500/20">
                  Real-Time Engine
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Receive instant alerts via SMS, Push, or Email when thresholds are breached
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {successBanner && (
          <div className="mt-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-emerald-400 text-xs font-semibold animate-shake">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successBanner}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Select Asset */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Select Asset</label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {assets.map((a) => (
                <option key={a.symbol} value={a.symbol}>
                  {a.icon} {a.symbol} — {a.name} (${a.current_price_usd.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {/* Current Asset Market Banner */}
          {selectedAsset && (
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedAsset.icon}</span>
                <div>
                  <div className="font-bold text-white text-sm">
                    {selectedAsset.symbol} / USD
                  </div>
                  <div className="text-[11px] text-slate-400">{selectedAsset.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-bold text-amber-400">
                  ${selectedAsset.current_price_usd.toLocaleString()}
                </div>
                <div
                  className={`text-[11px] font-semibold flex items-center justify-end gap-0.5 ${
                    selectedAsset.change_24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {selectedAsset.change_24h >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>
                    {selectedAsset.change_24h >= 0 ? '+' : ''}
                    {selectedAsset.change_24h}% (24h)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Alert Condition Selector */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Trigger Condition</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCondition('ABOVE')}
                className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  condition === 'ABOVE'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Price Rises Above (&gt;)</span>
              </button>
              <button
                type="button"
                onClick={() => setCondition('BELOW')}
                className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  condition === 'BELOW'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-lg shadow-rose-500/10'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                <span>Price Drops Below (&lt;)</span>
              </button>
            </div>
          </div>

          {/* Target Price Input & Quick Adjust Presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-300 font-semibold">Target Price Threshold (USD)</label>
              <span className="text-[11px] text-slate-400">
                Current: <span className="text-white font-mono">${selectedAsset?.current_price_usd.toLocaleString()}</span>
              </span>
            </div>

            <div className="relative flex items-center">
              <div className="absolute left-3 text-slate-400 font-bold text-sm">$</div>
              <input
                type="number"
                step="any"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2.5 text-white font-mono text-base font-bold focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            {/* Quick % Adjust Buttons */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] text-slate-500 font-semibold shrink-0">Presets:</span>
              {[-10, -5, -1, 1, 5, 10].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleApplyPercentage(pct)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border cursor-pointer transition-colors shrink-0 ${
                    pct > 0
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {pct > 0 ? `+${pct}%` : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Channel */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Notification Channel</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'SMS', label: 'SMS / MoMo', icon: Smartphone },
                { id: 'PUSH', label: 'In-App / Push', icon: Zap },
                { id: 'EMAIL', label: 'Email', icon: Mail },
                { id: 'IN_APP', label: 'Dashboard', icon: Bell }
              ].map((ch) => {
                const Icon = ch.icon;
                const isSel = notificationType === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setNotificationType(ch.id as any)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-[11px] font-bold transition-all cursor-pointer ${
                      isSel
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{ch.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact Details Input if SMS or EMAIL */}
          {(notificationType === 'SMS' || notificationType === 'EMAIL') && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {notificationType === 'SMS' ? 'Mobile Phone Number (SMS)' : 'Email Address'}
              </label>
              <input
                type={notificationType === 'SMS' ? 'tel' : 'email'}
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder={notificationType === 'SMS' ? '0780455033' : 'user@example.com'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          )}

          {/* Optional Note / Purpose */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Custom Note (Optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Stop-loss trigger or target profit point"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Price Alert</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
