import React, { useState, useRef } from 'react';
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
  Coins,
  Download,
  Share2,
  DollarSign,
  Info
} from 'lucide-react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Asset, WalletAccount, ExternalWallet } from '../types';

interface ActionModalsProps {
  modalType: 'SEND' | 'RECEIVE' | 'DEPOSIT' | 'WITHDRAW' | 'CONNECT_WALLET' | null;
  onClose: () => void;
  assets: Asset[];
  wallets: WalletAccount[];
  externalWallets?: ExternalWallet[];
  initialSymbol?: string;
  onExecuteSend: (symbol: string, recipient: string, amount: number) => Promise<void>;
  onExecuteWithdraw: (symbol: string, destination: string, amount: number) => Promise<void>;
  onConnectExternalWallet: (type: ExternalWallet['type']) => void;
}

export const ActionModals: React.FC<ActionModalsProps> = ({
  modalType,
  onClose,
  assets,
  wallets,
  externalWallets = [],
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
  const [copiedUri, setCopiedUri] = useState<boolean>(false);
  const [walletSearch, setWalletSearch] = useState<string>('');

  // Receive modal custom amount & note state
  const [receiveAmount, setReceiveAmount] = useState<string>('');
  const [receiveNote, setReceiveNote] = useState<string>('');
  const [showAmountInput, setShowAmountInput] = useState<boolean>(false);
  const qrCanvasRef = useRef<HTMLDivElement>(null);

  if (!modalType) return null;

  const currentAsset = assets.find((a) => a.symbol === selectedSymbol) || assets[0];
  const currentWallet = wallets.find((w) => w.symbol === selectedSymbol);
  const rawAddress = currentWallet?.address || '0780455033';

  // Construct standard URI for payment scanning
  const generatePaymentURI = () => {
    const amtNum = parseFloat(receiveAmount);
    const hasAmt = !isNaN(amtNum) && amtNum > 0;

    if (selectedSymbol === 'RWF') {
      // Mobile Money USSD / Payment format
      const params = new URLSearchParams();
      if (hasAmt) params.set('amount', amtNum.toString());
      if (receiveNote) params.set('note', receiveNote);
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      return `tel:*182*1*1*${rawAddress}#` + (hasAmt ? ` (${amtNum} RWF)` : '');
    }

    if (selectedSymbol === 'BTC') {
      const params = new URLSearchParams();
      if (hasAmt) params.set('amount', amtNum.toString());
      if (receiveNote) params.set('message', receiveNote);
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      return `bitcoin:${rawAddress}${queryStr}`;
    }

    if (selectedSymbol === 'USDT' || selectedSymbol === 'USDC' || selectedSymbol === 'ETH') {
      const params = new URLSearchParams();
      if (hasAmt) params.set('value', amtNum.toString());
      if (receiveNote) params.set('message', receiveNote);
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      return `ethereum:${rawAddress}${queryStr}`;
    }

    // Default raw address or URI
    const params = new URLSearchParams();
    if (hasAmt) params.set('amount', amtNum.toString());
    if (receiveNote) params.set('memo', receiveNote);
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return `${selectedSymbol.toLowerCase()}:${rawAddress}${queryStr}`;
  };

  const paymentURI = generatePaymentURI();
  const qrPayload = receiveAmount ? paymentURI : rawAddress;

  const handleDownloadQR = () => {
    if (!qrCanvasRef.current) return;
    const canvas = qrCanvasRef.current.querySelector('canvas');
    if (!canvas) return;

    const imageUri = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.download = `kofi-${selectedSymbol}-qr-${Date.now()}.png`;
    downloadLink.href = imageUri;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

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
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Receive & Deposit Funds</h3>
                <p className="text-xs text-slate-400">Scan QR or copy address to transfer to your vault</p>
              </div>
            </div>

            {/* Asset Selector */}
            <div className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800">
              <div className="text-xs font-semibold text-slate-400 pl-2 text-left">Asset / Currency</div>
              <select
                value={selectedSymbol}
                onChange={(e) => {
                  setSelectedSymbol(e.target.value);
                  setReceiveAmount('');
                  setReceiveNote('');
                }}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold text-xs focus:outline-none cursor-pointer"
              >
                {assets.map((a) => (
                  <option key={a.symbol} value={a.symbol}>
                    {a.icon} {a.symbol} - {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Network Badge */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-[11px] text-slate-400">Supported Network:</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {currentWallet?.network || 'Omni-Settlement'}
              </span>
            </div>

            {/* High-Contrast Interactive QR Code Container */}
            <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl border-4 border-amber-500/30">
              <div className="flex flex-col items-center justify-center p-2 bg-white rounded-2xl">
                {/* SVG Render for ultra-sharp on-screen display */}
                <QRCodeSVG
                  value={qrPayload}
                  size={190}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                />

                <div className="mt-2 text-center">
                  <div className="text-[11px] font-extrabold text-slate-900 tracking-wider">
                    KOFI PAY • {selectedSymbol}
                  </div>
                  {receiveAmount && (
                    <div className="text-xs font-black text-amber-600 font-mono">
                      Request: {parseFloat(receiveAmount).toLocaleString()} {selectedSymbol}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Hidden Canvas used for high-res PNG file generation */}
            <div ref={qrCanvasRef} className="hidden" aria-hidden="true">
              <QRCodeCanvas
                value={qrPayload}
                size={512}
                level="H"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#0f172a"
              />
            </div>

            {/* Optional Amount Specification Toggle */}
            <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowAmountInput(!showAmountInput)}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{showAmountInput ? 'Hide Amount Specification' : '+ Add Specific Amount to QR Code'}</span>
                </button>
                {receiveAmount && (
                  <span className="text-[10px] text-emerald-400 font-bold">Amount Encoded</span>
                )}
              </div>

              {showAmountInput && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                      Request Amount ({selectedSymbol})
                    </label>
                    <input
                      type="number"
                      value={receiveAmount}
                      onChange={(e) => setReceiveAmount(e.target.value)}
                      placeholder="0.00"
                      step="any"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                      Payment Memo / Reference
                    </label>
                    <input
                      type="text"
                      value={receiveNote}
                      onChange={(e) => setReceiveNote(e.target.value)}
                      placeholder="e.g. Invoice #1042"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Wallet Address Display */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs font-mono text-left">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-semibold mb-1">
                <span>{selectedSymbol} Deposit Address</span>
                <span className="text-amber-400">{currentWallet?.network}</span>
              </div>
              <div className="text-slate-100 font-bold break-all selection:bg-amber-500 selection:text-slate-950">
                {rawAddress}
              </div>
            </div>

            {/* Action Buttons: Copy Address, Copy URI, Download QR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleCopy(rawAddress)}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Address Copied!' : 'Copy Address'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadQR}
                className="py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Save QR Image (PNG)</span>
              </button>
            </div>

            {/* Security note */}
            <div className="flex items-start gap-2 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 text-left">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Send only <strong className="text-slate-200">{selectedSymbol}</strong> via{' '}
                <strong className="text-slate-200">{currentWallet?.network || 'official channels'}</strong> to this address. Transfers are confirmed automatically in the Rust Double-Entry Ledger.
              </span>
            </div>
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

        {/* 5. CONNECT NON-CUSTODIAL WALLET OR BANK APP MODAL */}
        {modalType === 'CONNECT_WALLET' && (
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Connect Wallet or Bank App</h3>
                <p className="text-xs text-slate-400">Link Web3 wallets, Lightning nodes, and international bank accounts</p>
              </div>
            </div>

            {/* Search filter input */}
            <div className="mb-3">
              <input
                type="text"
                placeholder="Search wallets, LNbits, Spark, banks..."
                value={walletSearch}
                onChange={(e) => setWalletSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: 'SPARK', name: 'Spark Wallet', desc: 'Lightning L2 & Bitcoin Protocol', icon: '⚡', category: 'Web3 & Crypto' },
                  { id: 'LNBITS', name: 'LNbits Hub', desc: 'Custom Lightning Accounts & Extensions', icon: '⚡', category: 'Lightning & FinTech' },
                  { id: 'STRIKE', name: 'Strike Global', desc: 'Instant Lightning & Borderless Payments', icon: '⚡', category: 'Lightning & FinTech' },
                  { id: 'METAMASK', name: 'MetaMask', desc: 'Ethereum, Polygon, Arbitrum & BSC', icon: '🦊', category: 'Web3 & Crypto' },
                  { id: 'PHANTOM', name: 'Phantom Wallet', desc: 'Solana, Bitcoin & Ethereum', icon: '👻', category: 'Web3 & Crypto' },
                  { id: 'COINBASE', name: 'Coinbase Wallet', desc: 'Base L2 & Self-Custody', icon: '🔵', category: 'Web3 & Crypto' },
                  { id: 'WALLETCONNECT', name: 'WalletConnect v2', desc: 'Trust Wallet, Rainbow & 300+ Wallets', icon: '🌐', category: 'Web3 & Crypto' },
                  { id: 'HARDWARE_LEDGER', name: 'Hardware Ledger', desc: 'Cold Storage Secure Enclave', icon: '🔒', category: 'Web3 & Crypto' },
                  { id: 'CASHAPP', name: 'Cash App', desc: 'Bitcoin & US Stablecoin Routing', icon: '💚', category: 'Lightning & FinTech' },
                  { id: 'REVOLUT', name: 'Revolut Banking', desc: 'Multi-Currency IBAN & FX', icon: '💳', category: 'Lightning & FinTech' },
                  { id: 'CHIME', name: 'Chime FinTech', desc: 'US Checking & Direct Deposit', icon: '🏦', category: 'Lightning & FinTech' },
                  { id: 'MONZO', name: 'Monzo UK', desc: 'UK Banking & Savings Pots', icon: '🟠', category: 'Lightning & FinTech' },
                  { id: 'PAYPAL', name: 'PayPal Digital', desc: 'Global P2P & Merchant Checkout', icon: '🅿️', category: 'Lightning & FinTech' },
                  { id: 'CHASE', name: 'Chase Bank', desc: 'US Commercial & Retail Banking', icon: '🏛️', category: 'Commercial Banks' },
                  { id: 'BOA', name: 'Bank of America', desc: 'Checking, Savings & Wire Transfer', icon: '🏢', category: 'Commercial Banks' },
                  { id: 'EQUITY', name: 'Equity Bank East Africa', desc: 'East African Cross-Border Settlement', icon: '🌍', category: 'Commercial Banks' }
                ]
                  .filter((w) =>
                    w.name.toLowerCase().includes(walletSearch.toLowerCase()) ||
                    w.desc.toLowerCase().includes(walletSearch.toLowerCase()) ||
                    w.category.toLowerCase().includes(walletSearch.toLowerCase())
                  )
                  .map((w) => {
                    const isConnected = externalWallets.some((ew) => ew.type === w.id);
                    return (
                      <button
                        key={w.id}
                        onClick={() => {
                          onConnectExternalWallet(w.id as any);
                          onClose();
                        }}
                        className={`p-3 rounded-xl border flex flex-col justify-between text-left transition-colors cursor-pointer ${
                          isConnected
                            ? 'bg-emerald-950/20 border-emerald-500/40 hover:bg-emerald-950/30'
                            : 'bg-slate-950 hover:bg-slate-900 border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{w.icon}</span>
                            <div>
                              <div className="font-bold text-white text-xs">{w.name}</div>
                              <div className="text-[10px] text-slate-400">{w.category}</div>
                            </div>
                          </div>
                          {isConnected ? (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Connected
                            </span>
                          ) : (
                            <span className="text-amber-400 font-semibold text-[10px] bg-amber-500/10 px-2 py-0.5 rounded-full shrink-0">
                              Connect
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{w.desc}</p>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
