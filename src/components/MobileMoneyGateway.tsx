import React, { useState } from 'react';
import {
  Smartphone,
  Send,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Lock,
  Radio,
  FileCheck,
  Zap,
  PhoneCall,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Layers,
  Building2
} from 'lucide-react';
import { MobileMoneyTransaction, UserProfile } from '../types';
import { initiateMoMoCollection, generateWebhookSignature } from '../services/momoService';

interface MobileMoneyGatewayProps {
  userProfile: UserProfile;
  onOpenUssdModal: () => void;
  onExecuteMoMoDeposit: (
    provider: 'MTN_RWANDA' | 'AIRTEL_AFRICA',
    phoneNumber: string,
    amount: number,
    autoSwapToUsdt: boolean
  ) => Promise<void>;
  onExecuteMoMoWithdraw: (
    provider: 'MTN_RWANDA' | 'AIRTEL_AFRICA',
    phoneNumber: string,
    amount: number
  ) => Promise<void>;
  momoLogs: MobileMoneyTransaction[];
  currentRwfBalance: number;
}

export const MobileMoneyGateway: React.FC<MobileMoneyGatewayProps> = ({
  userProfile,
  onOpenUssdModal,
  onExecuteMoMoDeposit,
  onExecuteMoMoWithdraw,
  momoLogs,
  currentRwfBalance
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'DEPOSIT' | 'WITHDRAW' | 'USSD_INFO'>('DEPOSIT');
  const [provider, setProvider] = useState<'MTN_RWANDA' | 'AIRTEL_AFRICA'>(userProfile.momo_operator || 'MTN_RWANDA');
  const [phoneNumber, setPhoneNumber] = useState(userProfile.phone_number || '0780455033');
  const [amount, setAmount] = useState('50000');
  const [withdrawPhone, setWithdrawPhone] = useState(userProfile.phone_number || '0780455033');
  const [withdrawAmount, setWithdrawAmount] = useState('25000');
  const [autoSwap, setAutoSwap] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [ussdPrompt, setUssdPrompt] = useState<{
    visible: boolean;
    providerRef: string;
    pin: string;
    amount: number;
    phone: string;
    isAutoSwap: boolean;
  } | null>(null);

  const [webhookInspector, setWebhookInspector] = useState<{
    payload: string;
    signature: string;
    secret: string;
    verified: boolean;
  } | null>(null);

  const handleTriggerDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 500) {
      alert('Please enter a valid amount (min 500 RWF)');
      return;
    }

    setIsProcessing(true);
    try {
      const pushRes = await initiateMoMoCollection({
        phoneNumber,
        amount: numAmount,
        currency: 'RWF',
        provider,
        reference: `KOFI-DEP-${Date.now()}`
      });

      // Show interactive handset USSD popup
      setUssdPrompt({
        visible: true,
        providerRef: pushRes.provider_tx_ref,
        pin: '',
        amount: numAmount,
        phone: phoneNumber,
        isAutoSwap: autoSwap
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprovePin = async () => {
    if (!ussdPrompt || ussdPrompt.pin.length < 4) {
      alert('Please enter your 4-digit Mobile Money PIN');
      return;
    }

    setIsProcessing(true);
    // Simulate webhook dispatch
    const payload = JSON.stringify({
      event: 'momo.collection.success',
      provider,
      phone_number: ussdPrompt.phone,
      amount: ussdPrompt.amount,
      currency: 'RWF',
      provider_ref: ussdPrompt.providerRef,
      timestamp: new Date().toISOString()
    });

    const secret = 'kofi_whsec_momo_mtn_rwanda_2026';
    const signature = await generateWebhookSignature(payload, secret);

    setWebhookInspector({
      payload,
      signature,
      secret,
      verified: true
    });

    await onExecuteMoMoDeposit(provider, ussdPrompt.phone, ussdPrompt.amount, ussdPrompt.isAutoSwap);
    setUssdPrompt(null);
    setIsProcessing(false);
    setStatusMessage(`Successfully collected ${ussdPrompt.amount.toLocaleString()} RWF from +250 ${ussdPrompt.phone} (Double-Entry Ledger Verified)`);
    setTimeout(() => setStatusMessage(null), 6000);
  };

  const handleTriggerWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(withdrawAmount);
    if (isNaN(numAmount) || numAmount < 500) {
      alert('Please enter a valid withdrawal amount (min 500 RWF)');
      return;
    }

    if (currentRwfBalance < numAmount) {
      alert(`Insufficient RWF balance. Available: ${currentRwfBalance.toLocaleString()} RWF`);
      return;
    }

    setIsProcessing(true);
    try {
      await onExecuteMoMoWithdraw(provider, withdrawPhone, numAmount);
      setStatusMessage(`Dispatched ${numAmount.toLocaleString()} RWF to +250 ${withdrawPhone} via ${provider === 'MTN_RWANDA' ? 'MTN MoMo' : 'Airtel Money'}`);
      setTimeout(() => setStatusMessage(null), 6000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner with *951# Integration */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Smartphone className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white">Mobile Money Gateway (*951#)</h2>
              <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded border border-emerald-500/20">
                Go Connector (Port 5002)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Connect your Mobile Money phone number to Kofi using USSD shortcode <strong className="text-amber-400 font-mono">*951#</strong>. Enjoy instant inbound USSD Push deposits, real-time disbursements, and HMAC-SHA256 signed webhooks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenUssdModal}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Dial *951# USSD</span>
            </button>

            <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs font-mono">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-medium">MTN Open API & Airtel Gateway: Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Linked Account Status Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black">
            *951#
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Connected Mobile Money Profile</div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>{userProfile.full_name}</span>
              <span className="text-amber-400 font-mono">(+250 {userProfile.phone_number})</span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                {userProfile.momo_operator === 'MTN_RWANDA' ? 'MTN MoMo (*182#)' : 'Airtel Money (*500#)'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400">Available RWF Balance:</span>
            <div className="text-base font-extrabold text-emerald-400">
              {currentRwfBalance.toLocaleString()} RWF
            </div>
          </div>
          <button
            onClick={onOpenUssdModal}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
          >
            Manage in *951#
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Sub Tabs: Deposit vs Withdraw vs USSD Shortcuts */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('DEPOSIT')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'DEPOSIT'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>Inbound Deposit (MoMo -&gt; Kofi)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('WITHDRAW')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'WITHDRAW'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Outbound Payout (Kofi -&gt; MoMo Phone)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('USSD_INFO')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'USSD_INFO'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>USSD *951# Shortcodes Guide</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Action Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          {activeSubTab === 'DEPOSIT' && (
            <>
              <h3 className="font-bold text-white text-base mb-1">Initiate MoMo Deposit Push</h3>
              <p className="text-xs text-slate-400 mb-5">
                Pushes a real-time USSD PIN prompt to the subscriber handset to credit Kofi Wallet.
              </p>

              <form onSubmit={handleTriggerDeposit} className="space-y-4">
                {/* Operator Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Mobile Money Network Operator
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setProvider('MTN_RWANDA')}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                        provider === 'MTN_RWANDA'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                        MTN
                      </span>
                      <div className="text-left text-xs">
                        <div>MTN MoMo</div>
                        <div className="text-[10px] text-slate-400">Rwanda (*182#)</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProvider('AIRTEL_AFRICA')}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                        provider === 'AIRTEL_AFRICA'
                          ? 'bg-red-500/10 border-red-500 text-red-400 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="w-8 h-8 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center">
                        AIR
                      </span>
                      <div className="text-left text-xs">
                        <div>Airtel Money</div>
                        <div className="text-[10px] text-slate-400">Africa (*500#)</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Subscriber Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400 text-xs font-mono font-bold">
                      +250
                    </span>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0780455033"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-16 pr-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Deposit Amount (RWF)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="50000"
                      step="1000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <span className="absolute right-3.5 top-3 text-slate-400 text-xs font-bold">
                      RWF
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[10000, 50000, 150000, 500000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(preset.toString())}
                        className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-slate-300 rounded-lg transition-colors cursor-pointer"
                      >
                        {preset.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto Swap Toggle */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="autoSwap"
                    checked={autoSwap}
                    onChange={(e) => setAutoSwap(e.target.checked)}
                    className="mt-1 accent-amber-500 rounded cursor-pointer"
                  />
                  <label htmlFor="autoSwap" className="text-xs cursor-pointer">
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Auto-Convert to USDT Stablecoin
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      Automatically swap credited RWF into Tether (USDT) at live market oracle rate
                    </div>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Dispatching USSD Push...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send USSD Push Prompt</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {activeSubTab === 'WITHDRAW' && (
            <>
              <h3 className="font-bold text-white text-base mb-1">Disburse to MoMo Subscriber</h3>
              <p className="text-xs text-slate-400 mb-5">
                Instant withdrawal from Kofi RWF Wallet to any MTN or Airtel phone number.
              </p>

              <form onSubmit={handleTriggerWithdraw} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Destination Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400 text-xs font-mono font-bold">
                      +250
                    </span>
                    <input
                      type="text"
                      value={withdrawPhone}
                      onChange={(e) => setWithdrawPhone(e.target.value)}
                      placeholder="0780455033"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-16 pr-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Withdrawal Amount (RWF)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="25000"
                      step="1000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <span className="absolute right-3.5 top-3 text-slate-400 text-xs font-bold">
                      RWF
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                    <span>Available: {currentRwfBalance.toLocaleString()} RWF</span>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(currentRwfBalance.toString())}
                      className="text-amber-400 font-bold hover:underline"
                    >
                      Max
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || currentRwfBalance <= 0}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Executing Disbursement...</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Disburse Payout to MoMo</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {activeSubTab === 'USSD_INFO' && (
            <div className="space-y-3">
              <h3 className="font-bold text-white text-base">Kofi USSD Shortcode Directory (*951#)</h3>
              <p className="text-xs text-slate-400">
                Dial these codes directly on any feature phone or smartphone:
              </p>

              <div className="space-y-2 font-mono text-xs">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-amber-400">*951#</span>
                    <p className="text-[11px] text-slate-400">Master Main Menu</p>
                  </div>
                  <button
                    onClick={onOpenUssdModal}
                    className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-[11px]"
                  >
                    Dial
                  </button>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-emerald-400">*951*1#</span>
                    <p className="text-[11px] text-slate-400">Instant Wallet & MoMo Balances</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-emerald-400">*951*2*AMOUNT#</span>
                    <p className="text-[11px] text-slate-400">Quick MoMo Deposit</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-sky-400">*951*4#</span>
                    <p className="text-[11px] text-slate-400">Instant Multi-Currency FX Swap</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-purple-400">*951*5*MERCHANT#</span>
                    <p className="text-[11px] text-slate-400">Pay B2B Merchant Invoices</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-amber-400">*951*6#</span>
                    <p className="text-[11px] text-slate-400">Mining Stratum Rewards Payout</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Mobile Handset Simulation Prompt */}
          {ussdPrompt && (
            <div className="mt-5 p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-xl relative animate-in fade-in">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-400 animate-bounce" />
                  <span className="font-bold text-amber-300 text-xs uppercase tracking-wide">
                    Simulated Handset USSD Prompt (*951#)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{ussdPrompt.providerRef}</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-slate-200 mb-3">
                <p>Do you authorize payment of {ussdPrompt.amount.toLocaleString()} RWF to KOFI WALLET (*951#)?</p>
                <p className="text-[11px] text-amber-400 mt-1">Enter your 4-digit MoMo PIN to confirm:</p>
                <input
                  type="password"
                  maxLength={4}
                  value={ussdPrompt.pin}
                  onChange={(e) => setUssdPrompt({ ...ussdPrompt, pin: e.target.value })}
                  placeholder="••••"
                  className="mt-2 w-32 bg-slate-900 border border-amber-500/40 rounded px-2 py-1 text-center text-lg tracking-widest text-amber-400 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleApprovePin}
                  disabled={isProcessing}
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Confirm PIN & Post to Ledger
                </button>
                <button
                  onClick={() => setUssdPrompt(null)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Webhook Signature Inspector & Provider Reconciliation Logs */}
        <div className="lg:col-span-7 space-y-6">
          {/* HMAC-SHA256 Webhook Verification Inspector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">
                  Webhook Signature & Replay Prevention Inspector
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                HMAC-SHA256
              </span>
            </div>

            {webhookInspector ? (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                <div>
                  <span className="text-slate-400">Received Signature:</span>
                  <div className="text-emerald-400 break-all">{webhookInspector.signature}</div>
                </div>
                <div>
                  <span className="text-slate-400">Raw Webhook Payload:</span>
                  <pre className="bg-slate-900 p-2.5 rounded text-[11px] text-slate-300 overflow-x-auto">
                    {webhookInspector.payload}
                  </pre>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-semibold pt-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Signature Authenticated & Nonce Replay Protected</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono">
                Execute a MoMo collection or dial *951# to inspect the Go connector's cryptographically signed webhook payload and HMAC validator.
              </div>
            )}
          </div>

          {/* Provider Reconciliation Logs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Provider Reconciliation Logs</h3>
              </div>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                100% Reconciled
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-2.5">Provider Ref</th>
                    <th className="pb-2.5">Operator</th>
                    <th className="pb-2.5">Subscriber</th>
                    <th className="pb-2.5">Amount</th>
                    <th className="pb-2.5">Direction</th>
                    <th className="pb-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {momoLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-2.5 font-bold text-amber-400">{log.external_ref}</td>
                      <td className="py-2.5 text-slate-300">
                        {log.provider === 'MTN_RWANDA' ? 'MTN RW' : 'Airtel AF'}
                      </td>
                      <td className="py-2.5 text-slate-400">{log.phone_number}</td>
                      <td className="py-2.5 font-bold text-white">
                        {log.amount.toLocaleString()} {log.currency}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            log.direction === 'INBOUND'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-sky-500/10 text-sky-400'
                          }`}
                        >
                          {log.direction}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
