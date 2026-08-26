import React, { useState } from 'react';
import {
  X,
  Send,
  QrCode,
  Copy,
  Check,
  ArrowUpRight,
  ArrowDownLeft,
  Smartphone,
  Wallet,
  ShieldCheck,
  RefreshCw,
  Coins
} from 'lucide-react';
import { Asset, WalletAccount, ExternalWallet } from '../types';

interface ActionModalsProps {
  modalType: 'SEND' | 'RECEIVE' | 'DEPOSIT' | 'WITHDRAW' | 'CONNECT_WALLET' | null;
  onClose: () => void;
  assets: Asset[];
  wallets: WalletAccount[];
  initialSymbol?: string;
  onExecuteSend: (symbol: string, recipient: string, amount: number) => Promise<void>;
  onExecuteWithdraw: (symbol: string, destination: string, amount: number) => Promise<void>;
  onConnectExternalWallet: (type: 'METAMASK' | 'WALLETCONNECT' | 'PHANTOM') => void;
}

export const ActionModals: React.FC<ActionModalsProps> = ({
  modalType,
  onClose,
  assets,
  wallets,
  initialSymbol = 'USDT',
  onExecuteSend,
  onExecuteWithdraw,
  onConnectExternalWallet
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(initialSymbol);
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (!modalType) return null;

  const currentAsset = assets.find((a) => a.symbol === selectedSymbol) || assets[0];
  const currentWallet = wallets.find((w) => w.symbol === selectedSymbol);

  const handleSendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!recipient || isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter valid recipient and amount');
      return;
    }
    if (currentWallet && currentWallet.balance < numAmount) {
      alert(`Insufficient ${selectedSymbol} balance.`);
      return;
    }

    setIsProcessing(true);
    try {
      await onExecuteSend(selectedSymbol, recipient, numAmount);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!recipient || isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter valid withdrawal destination and amount');
      return;
    }

    setIsProcessing(true);
    try {
      await onExecuteWithdraw(selectedSymbol, recipient, numAmount);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 1. SEND MODAL */}
        {modalType === 'SEND' && (
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Send Multi-Currency Payment</h3>
                <p className="text-xs text-slate-400">Double-entry logged with atomic balance guard</p>
              </div>
            </div>

            <form onSubmit={handleSendSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Asset</label>
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {assets.map((a) => (
                    <option key={a.symbol} value={a.symbol}>
                      {a.icon} {a.symbol} - {a.name}
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-slate-400 mt-1">
                  Available:{' '}
                  <span className="font-mono text-slate-200 font-semibold">
                    {currentWallet ? currentWallet.balance.toLocaleString() : '0'} {selectedSymbol}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Recipient Address, Phone, or Kofi ID
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0788123456 or 0x71c9... or user@kofi"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="any"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono text-lg font-bold focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex justify-between">
                <span>Estimated Network Fee:</span>
                <span className="text-slate-200 font-mono">0.0001 {selectedSymbol} (0.0%)</span>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{isProcessing ? 'Processing in Ledger...' : 'Confirm & Authorize Transfer'}</span>
              </button>
            </form>
          </div>
        )}

        {/* 2. RECEIVE / QR MODAL */}
        {modalType === 'RECEIVE' && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Receive Funds</h3>
            </div>

            <div className="mb-4">
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-xs focus:outline-none cursor-pointer"
              >
                {assets.map((a) => (
                  <option key={a.symbol} value={a.symbol}>
                    {a.icon} {a.symbol} ({a.name})
                  </option>
                ))}
              </select>
            </div>

            {/* High-Contrast QR Code Representation */}
            <div className="bg-white p-5 rounded-2xl inline-block shadow-xl mb-4">
              <div className="w-44 h-44 bg-slate-950 rounded-xl p-3 flex flex-col items-center justify-center gap-2 text-white font-mono text-[10px] text-center">
                <div className="text-amber-400 font-black text-xs">KOFI QR PAY</div>
                <div className="w-24 h-24 border-4 border-amber-400 border-dashed rounded-lg flex items-center justify-center text-xs">
                  [QR-MATRIX]
                </div>
                <div className="truncate max-w-[150px] text-[9px] text-slate-400">
                  {currentWallet?.address || '0780455033'}
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-left mb-4">
              <div className="text-slate-400 text-[10px] uppercase font-semibold mb-1">
                Your {selectedSymbol} Deposit Address ({currentWallet?.network})
              </div>
              <div className="text-amber-400 break-all">{currentWallet?.address || '0780455033'}</div>
            </div>

            <button
              onClick={() => handleCopy(currentWallet?.address || '0780455033')}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Address Copied to Clipboard!' : 'Copy Deposit Address'}</span>
            </button>
          </div>
        )}

        {/* 3. DEPOSIT MODAL */}
        {modalType === 'DEPOSIT' && (
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Deposit to Platform</h3>
                <p className="text-xs text-slate-400">Add funds via Mobile Money or Crypto Gateway</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-950 hover:bg-slate-850 rounded-xl border border-slate-800 transition-colors">
                <div className="flex items-center justify-between font-bold text-slate-200 mb-1">
                  <span className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-amber-400" />
                    Mobile Money (MTN / Airtel)
                  </span>
                  <span className="text-emerald-400 text-[10px]">Instant USSD</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Deposit RWF directly from your MTN MoMo (*182#) or Airtel Money wallet.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 hover:bg-slate-850 rounded-xl border border-slate-800 transition-colors">
                <div className="flex items-center justify-between font-bold text-slate-200 mb-1">
                  <span className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-sky-400" />
                    Cryptocurrency / Stablecoin Transfer
                  </span>
                  <span className="text-sky-400 text-[10px]">On-Chain</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Deposit USDT (TRC-20), USDC (Polygon), BTC (SegWit), or ETH (Mainnet).
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-5 w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Continue to Gateway
            </button>
          </div>
        )}

        {/* 4. WITHDRAW MODAL */}
        {modalType === 'WITHDRAW' && (
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Withdraw Funds</h3>
                <p className="text-xs text-slate-400">Disburse to Mobile Money or external crypto wallet</p>
              </div>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Asset to Withdraw</label>
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold cursor-pointer focus:outline-none"
                >
                  {assets.map((a) => (
                    <option key={a.symbol} value={a.symbol}>
                      {a.icon} {a.symbol} (Balance: {wallets.find((w) => w.symbol === a.symbol)?.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Destination (Phone Number or External Crypto Address)
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0788998877 or 0x71c9..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-base font-bold focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer mt-2 disabled:opacity-50"
              >
                {isProcessing ? 'Processing Withdrawal...' : 'Authorize Withdrawal'}
              </button>
            </form>
          </div>
        )}

        {/* 5. CONNECT NON-CUSTODIAL WALLET MODAL */}
        {modalType === 'CONNECT_WALLET' && (
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Connect Non-Custodial Web3 Wallet</h3>
                <p className="text-xs text-slate-400">Never shares your private key or seed phrase</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <button
                onClick={() => {
                  onConnectExternalWallet('METAMASK');
                  onClose();
                }}
                className="w-full p-3.5 bg-slate-950 hover:bg-slate-850 rounded-xl border border-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🦊</span>
                  <div>
                    <div className="font-bold text-white">MetaMask</div>
                    <div className="text-[11px] text-slate-400">Ethereum, Polygon, Arbitrum & BSC</div>
                  </div>
                </div>
                <span className="text-amber-400 font-semibold text-[11px]">Connect</span>
              </button>

              <button
                onClick={() => {
                  onConnectExternalWallet('WALLETCONNECT');
                  onClose();
                }}
                className="w-full p-3.5 bg-slate-950 hover:bg-slate-850 rounded-xl border border-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌐</span>
                  <div>
                    <div className="font-bold text-white">WalletConnect v2</div>
                    <div className="text-[11px] text-slate-400">Trust Wallet, Rainbow, Safe, 300+ Wallets</div>
                  </div>
                </div>
                <span className="text-amber-400 font-semibold text-[11px]">Scan QR</span>
              </button>

              <button
                onClick={() => {
                  onConnectExternalWallet('PHANTOM');
                  onClose();
                }}
                className="w-full p-3.5 bg-slate-950 hover:bg-slate-850 rounded-xl border border-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👻</span>
                  <div>
                    <div className="font-bold text-white">Phantom Wallet</div>
                    <div className="text-[11px] text-slate-400">Solana, Bitcoin & Ethereum</div>
                  </div>
                </div>
                <span className="text-amber-400 font-semibold text-[11px]">Connect</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
