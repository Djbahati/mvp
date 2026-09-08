import React, { useState } from 'react';
import {
  Smartphone,
  X,
  PhoneCall,
  Delete,
  RotateCcw,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Building2,
  Cpu,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import { UserProfile, WalletAccount } from '../types';

interface UssdSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  wallets: WalletAccount[];
  onRegisterAndLink: (name: string, phone: string, operator: 'MTN_RWANDA' | 'AIRTEL_AFRICA', pin: string) => void;
  onExecuteDeposit: (amount: number, pin: string) => void;
  onExecuteWithdraw: (phone: string, amount: number, pin: string) => void;
  onExecuteSwap: (fromSym: string, toSym: string, amount: number) => void;
  onPayMerchant: (merchantCode: string, amount: number) => void;
  onClaimMiningPayout: () => void;
  merkleRoot: string;
}

type ScreenState =
  | 'DIALER'
  | 'SESSION_ACTIVE'
  | 'REG_NAME'
  | 'REG_PHONE'
  | 'REG_OPERATOR'
  | 'REG_PIN'
  | 'REG_SUCCESS'
  | 'MENU_MAIN'
  | 'MENU_BALANCE'
  | 'MENU_DEPOSIT_AMT'
  | 'MENU_DEPOSIT_PIN'
  | 'MENU_DEPOSIT_SUCCESS'
  | 'MENU_WITHDRAW_PHONE'
  | 'MENU_WITHDRAW_AMT'
  | 'MENU_WITHDRAW_PIN'
  | 'MENU_WITHDRAW_SUCCESS'
  | 'MENU_SWAP_TYPE'
  | 'MENU_SWAP_AMT'
  | 'MENU_SWAP_SUCCESS'
  | 'MENU_MERCHANT_CODE'
  | 'MENU_MERCHANT_AMT'
  | 'MENU_MERCHANT_PIN'
  | 'MENU_MERCHANT_SUCCESS'
  | 'MENU_MINING_CHOICE'
  | 'MENU_MINING_SUCCESS'
  | 'MENU_LEDGER_PROOF';

export const UssdSimulatorModal: React.FC<UssdSimulatorModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  wallets,
  onRegisterAndLink,
  onExecuteDeposit,
  onExecuteWithdraw,
  onExecuteSwap,
  onPayMerchant,
  onClaimMiningPayout,
  merkleRoot
}) => {
  const [dialedString, setDialedString] = useState<string>('*951#');
  const [sessionState, setSessionState] = useState<ScreenState>('DIALER');
  const [userInput, setUserInput] = useState<string>('');
  
  // Registration temporary inputs
  const [regName, setRegName] = useState<string>('Peter Bahati');
  const [regPhone, setRegPhone] = useState<string>('0780455033');
  const [regOperator, setRegOperator] = useState<'MTN_RWANDA' | 'AIRTEL_AFRICA'>('MTN_RWANDA');
  const [regPin, setRegPin] = useState<string>('1234');

  // Transaction temp inputs
  const [tempAmount, setTempAmount] = useState<string>('50000');
  const [tempPhone, setTempPhone] = useState<string>('');
  const [tempPin, setTempPin] = useState<string>('');
  const [tempMerchantCode, setTempMerchantCode] = useState<string>('95120');
  const [tempSwapType, setTempSwapType] = useState<string>('1');

  if (!isOpen) return null;

  const rwfWallet = wallets.find((w) => w.symbol === 'RWF');
  const usdtWallet = wallets.find((w) => w.symbol === 'USDT');
  const btcWallet = wallets.find((w) => w.symbol === 'BTC');
  const usdWallet = wallets.find((w) => w.symbol === 'USD');

  // Handle dial button click
  const handleDialPress = (val: string) => {
    if (sessionState === 'DIALER') {
      setDialedString((prev) => prev + val);
    } else {
      setUserInput((prev) => prev + val);
    }
  };

  const handleBackspace = () => {
    if (sessionState === 'DIALER') {
      setDialedString((prev) => prev.slice(0, -1));
    } else {
      setUserInput((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (sessionState === 'DIALER') {
      setDialedString('');
    } else {
      setUserInput('');
    }
  };

  // Launch USSD Call
  const handleSendCall = () => {
    const raw = dialedString.trim();
    if (!raw.startsWith('*') || !raw.endsWith('#')) {
      alert('Please enter a valid USSD code starting with * and ending with # (e.g. *951#)');
      return;
    }

    if (raw === '*951#') {
      if (!userProfile.is_phone_linked) {
        setSessionState('REG_NAME');
      } else {
        setSessionState('MENU_MAIN');
      }
    } else if (raw === '*951*1#') {
      setSessionState('MENU_BALANCE');
    } else if (raw === '*951*2#') {
      setSessionState('MENU_DEPOSIT_AMT');
    } else if (raw === '*951*3#') {
      setSessionState('MENU_WITHDRAW_PHONE');
    } else if (raw === '*951*4#') {
      setSessionState('MENU_SWAP_TYPE');
    } else if (raw === '*951*5#') {
      setSessionState('MENU_MERCHANT_CODE');
    } else if (raw === '*951*6#') {
      setSessionState('MENU_MINING_CHOICE');
    } else if (raw === '*951*7#') {
      setSessionState('MENU_LEDGER_PROOF');
    } else {
      // General fallback
      if (!userProfile.is_phone_linked) {
        setSessionState('REG_NAME');
      } else {
        setSessionState('MENU_MAIN');
      }
    }
    setUserInput('');
  };

  // Submit response in active USSD session
  const handleSubmitSessionInput = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = userInput.trim();

    switch (sessionState) {
      case 'REG_NAME':
        if (val) setRegName(val);
        setSessionState('REG_PHONE');
        setUserInput('');
        break;

      case 'REG_PHONE':
        if (val) setRegPhone(val);
        setSessionState('REG_OPERATOR');
        setUserInput('');
        break;

      case 'REG_OPERATOR':
        if (val === '2') setRegOperator('AIRTEL_AFRICA');
        else setRegOperator('MTN_RWANDA');
        setSessionState('REG_PIN');
        setUserInput('');
        break;

      case 'REG_PIN':
        const pinVal = val || '1234';
        setRegPin(pinVal);
        onRegisterAndLink(regName, regPhone, regOperator, pinVal);
        setSessionState('REG_SUCCESS');
        setUserInput('');
        break;

      case 'REG_SUCCESS':
        setSessionState('MENU_MAIN');
        setUserInput('');
        break;

      case 'MENU_MAIN':
        if (val === '1') setSessionState('MENU_BALANCE');
        else if (val === '2') setSessionState('MENU_DEPOSIT_AMT');
        else if (val === '3') setSessionState('MENU_WITHDRAW_PHONE');
        else if (val === '4') setSessionState('MENU_SWAP_TYPE');
        else if (val === '5') setSessionState('MENU_MERCHANT_CODE');
        else if (val === '6') setSessionState('MENU_MINING_CHOICE');
        else if (val === '7') setSessionState('MENU_LEDGER_PROOF');
        else if (val === '0') setSessionState('DIALER');
        else {
          alert('Invalid option. Enter 1-7 or 0');
        }
        setUserInput('');
        break;

      case 'MENU_BALANCE':
        if (val === '0') setSessionState('MENU_MAIN');
        else setSessionState('MENU_MAIN');
        setUserInput('');
        break;

      case 'MENU_DEPOSIT_AMT':
        if (val) setTempAmount(val);
        setSessionState('MENU_DEPOSIT_PIN');
        setUserInput('');
        break;

      case 'MENU_DEPOSIT_PIN':
        setTempPin(val || '1234');
        onExecuteDeposit(parseFloat(tempAmount) || 50000, val || '1234');
        setSessionState('MENU_DEPOSIT_SUCCESS');
        setUserInput('');
        break;

      case 'MENU_DEPOSIT_SUCCESS':
        setSessionState('MENU_MAIN');
        setUserInput('');
        break;

      case 'MENU_WITHDRAW_PHONE':
        setTempPhone(val || userProfile.phone_number);
        setSessionState('MENU_WITHDRAW_AMT');
        setUserInput('');
        break;

      case 'MENU_WITHDRAW_AMT':
        if (val) setTempAmount(val);
        setSessionState('MENU_WITHDRAW_PIN');
        setUserInput('');
        break;

      case 'MENU_WITHDRAW_PIN':
        setTempPin(val || '1234');
        onExecuteWithdraw(tempPhone || userProfile.phone_number, parseFloat(tempAmount) || 20000, val || '1234');
        setSessionState('MENU_WITHDRAW_SUCCESS');
        setUserInput('');
        break;

      case 'MENU_WITHDRAW_SUCCESS':
        setSessionState('MENU_MAIN');
        setUserInput('');
        break;

      case 'MENU_SWAP_TYPE':
        setTempSwapType(val || '1');
        setSessionState('MENU_SWAP_AMT');
        setUserInput('');
        break;

      case 'MENU_SWAP_AMT':
        const amt = parseFloat(val) || 50000;
        if (tempSwapType === '1') {
          onExecuteSwap('RWF', 'USDT', amt);
        } else if (tempSwapType === '2') {
          onExecuteSwap('USDT', 'RWF', parseFloat(val) || 50);
        } else {
          onExecuteSwap('RWF', 'BTC', amt);
        }
        setSessionState('MENU_SWAP_SUCCESS');
        setUserInput('');
        break;

      case 'MENU_SWAP_SUCCESS':
        setSessionState('MENU_MAIN');
        setUserInput('');
        break;

      case 'MENU_MERCHANT_CODE':
        setTempMerchantCode(val || '95120');
        setSessionState('MENU_MERCHANT_AMT');
        setUserInput('');
        break;

      case 'MENU_MERCHANT_AMT':
        setTempAmount(val || '15000');
        setSessionState('MENU_MERCHANT_PIN');
        setUserInput('');
        break;

      case 'MENU_MERCHANT_PIN':
        onPayMerchant(tempMerchantCode || '95120', parseFloat(tempAmount) || 15000);
        setSessionState('MENU_MERCHANT_SUCCESS');
        setUserInput('');
        break;

      case 'MENU_MERCHANT_SUCCESS':
        setSessionState('MENU_MAIN');
        setUserInput('');
        break;

      case 'MENU_MINING_CHOICE':
        onClaimMiningPayout();
        setSessionState('MENU_MINING_SUCCESS');
        setUserInput('');
        break;

      case 'MENU_MINING_SUCCESS':
      case 'MENU_LEDGER_PROOF':
        setSessionState('MENU_MAIN');
        setUserInput('');
        break;

      default:
        setSessionState('MENU_MAIN');
        setUserInput('');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                KOFI USSD Handset (*951#)
                {userProfile.is_phone_linked && (
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                    Linked
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                MTN MoMo (*182#) • Airtel Money (*500#) • Kofi Bridge
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Handset Body */}
        <div className="p-6 space-y-5">
          {/* Virtual Mobile Screen */}
          <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 shadow-inner min-h-[220px] flex flex-col justify-between font-mono relative overflow-hidden">
            {/* Status Bar */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-900 pb-1.5 mb-2">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{userProfile.momo_operator === 'MTN_RWANDA' ? 'MTN RW 4G' : 'AIRTEL AF 4G'}</span>
              </div>
              <div className="text-slate-400">
                {userProfile.is_phone_linked ? `+250 ${userProfile.phone_number}` : 'No SIM Profile'}
              </div>
            </div>

            {/* Screen Content View */}
            <div className="flex-1 text-xs space-y-2 text-slate-200">
              {sessionState === 'DIALER' && (
                <div className="flex flex-col items-center justify-center h-full text-center py-4">
                  <div className="text-slate-400 text-[11px] mb-1">Enter USSD Shortcode:</div>
                  <div className="text-2xl font-black text-amber-400 tracking-wider font-mono bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-800 w-full">
                    {dialedString || '---'}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Press <span className="text-emerald-400 font-bold">CALL</span> to execute or choose quick code below
                  </p>
                </div>
              )}

              {/* Registration Flow */}
              {sessionState === 'REG_NAME' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <div className="text-amber-400 font-bold text-[11px]">KOFI FinTech Gateway (*951#)</div>
                  <p className="text-slate-300">Welcome! Connect your Mobile Money to Kofi Wallet.</p>
                  <p className="text-slate-400 text-[11px]">Step 1/4: Enter your Full Name:</p>
                  <div className="bg-slate-900 px-3 py-1.5 rounded border border-amber-500/40 text-amber-300 font-bold">
                    {userInput || regName}
                  </div>
                </div>
              )}

              {sessionState === 'REG_PHONE' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <div className="text-amber-400 font-bold text-[11px]">KOFI FinTech Gateway (*951#)</div>
                  <p className="text-slate-400 text-[11px]">Step 2/4: Enter MoMo Phone Number (+250):</p>
                  <div className="bg-slate-900 px-3 py-1.5 rounded border border-amber-500/40 text-amber-300 font-bold">
                    {userInput || regPhone}
                  </div>
                </div>
              )}

              {sessionState === 'REG_OPERATOR' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <div className="text-amber-400 font-bold text-[11px]">Step 3/4: Select Mobile Network</div>
                  <p className="text-slate-300">1. MTN MoMo Rwanda (*182#)</p>
                  <p className="text-slate-300">2. Airtel Money Africa (*500#)</p>
                  <p className="text-slate-400 text-[10px]">Enter 1 or 2:</p>
                  <div className="bg-slate-900 px-3 py-1 rounded border border-amber-500/40 text-amber-300 font-bold w-16 text-center">
                    {userInput || '1'}
                  </div>
                </div>
              )}

              {sessionState === 'REG_PIN' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <div className="text-amber-400 font-bold text-[11px]">Step 4/4: Set 4-digit Security PIN</div>
                  <p className="text-slate-300">Create a 4-digit transaction PIN for Kofi *951#:</p>
                  <div className="bg-slate-900 px-3 py-1.5 rounded border border-amber-500/40 text-amber-300 font-bold tracking-widest text-center">
                    {userInput ? '••••' : '1234'}
                  </div>
                </div>
              )}

              {sessionState === 'REG_SUCCESS' && (
                <div className="space-y-2 text-center py-2 animate-in fade-in">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>MoMo Connected via *951#!</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    User: <strong className="text-white">{userProfile.full_name || regName}</strong>
                    <br />
                    Phone: <span className="text-amber-400">+250 {userProfile.phone_number || regPhone}</span>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Wallets & Double-Entry Ledger master account provisioned.
                  </p>
                  <p className="text-[10px] text-amber-400 font-bold">Press SEND/OK to view Menu.</p>
                </div>
              )}

              {/* Main Menu for Linked User */}
              {sessionState === 'MENU_MAIN' && (
                <div className="space-y-1 animate-in fade-in text-[11px]">
                  <div className="text-amber-400 font-bold text-[11px] flex justify-between">
                    <span>KOFI USSD (*951#)</span>
                    <span className="text-emerald-400">ONLINE</span>
                  </div>
                  <p className="text-slate-400 text-[10px]">Hi {userProfile.full_name.split(' ')[0]}, choose option:</p>
                  <div className="grid grid-cols-1 gap-0.5 text-slate-200">
                    <div>1. Check Balances & Wallets</div>
                    <div>2. Deposit MoMo -&gt; Kofi Wallet</div>
                    <div>3. Send / Withdraw to MoMo</div>
                    <div>4. Instant FX Swap (RWF/USDT/BTC)</div>
                    <div>5. Pay B2B Merchant (*951*5#)</div>
                    <div>6. Claim Mining Rewards to MoMo</div>
                    <div>7. Double-Entry Merkle Proof</div>
                    <div className="text-slate-400">0. Exit Session</div>
                  </div>
                  <div className="bg-slate-900 px-2.5 py-1 rounded border border-amber-500/40 text-amber-300 font-bold w-20 text-center mt-1">
                    {userInput || '_'}
                  </div>
                </div>
              )}

              {/* Balance Screen */}
              {sessionState === 'MENU_BALANCE' && (
                <div className="space-y-1.5 text-[11px] animate-in fade-in">
                  <div className="text-amber-400 font-bold">Kofi Wallets Balance (*951*1#)</div>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">RWF (MoMo):</span>
                      <span className="font-bold text-white">{rwfWallet?.balance.toLocaleString()} RWF</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">USDT Stablecoin:</span>
                      <span className="font-bold text-emerald-400">{usdtWallet?.balance.toLocaleString()} USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bitcoin (BTC):</span>
                      <span className="font-bold text-amber-400">{btcWallet?.balance} BTC</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">0. Back to Main Menu</p>
                </div>
              )}

              {/* Deposit Flow */}
              {sessionState === 'MENU_DEPOSIT_AMT' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <div className="text-amber-400 font-bold text-[11px]">Deposit MoMo -&gt; Kofi (*951*2#)</div>
                  <p className="text-slate-300">Enter deposit amount in RWF (min 500):</p>
                  <div className="bg-slate-900 px-3 py-1.5 rounded border border-amber-500/40 text-amber-300 font-bold">
                    {userInput || tempAmount} RWF
                  </div>
                </div>
              )}

              {sessionState === 'MENU_DEPOSIT_PIN' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <div className="text-amber-400 font-bold text-[11px]">Authorize MoMo Collection</div>
                  <p className="text-slate-300">Authorize transfer of {tempAmount} RWF from +250 {userProfile.phone_number} to Kofi:</p>
                  <p className="text-slate-400 text-[10px]">Enter your 4-digit MoMo PIN:</p>
                  <div className="bg-slate-900 px-3 py-1 rounded border border-amber-500/40 text-amber-300 font-bold text-center tracking-widest">
                    {userInput ? '••••' : '1234'}
                  </div>
                </div>
              )}

              {sessionState === 'MENU_DEPOSIT_SUCCESS' && (
                <div className="space-y-1.5 text-center py-2 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                  <div className="text-emerald-400 font-bold text-xs">Deposit Successful!</div>
                  <p className="text-slate-300 text-[11px]">
                    Credited <strong>{parseFloat(tempAmount).toLocaleString()} RWF</strong> to Kofi Wallet.
                  </p>
                  <p className="text-[10px] text-slate-400">Posted to Rust Double-Entry Ledger (ACID Validated).</p>
                </div>
              )}

              {/* Withdraw / Send Flow */}
              {sessionState === 'MENU_WITHDRAW_PHONE' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <div className="text-amber-400 font-bold text-[11px]">Withdraw to MoMo (*951*3#)</div>
                  <p className="text-slate-300">Enter Recipient Mobile Money Phone Number:</p>
                  <div className="bg-slate-900 px-3 py-1.5 rounded border border-amber-500/40 text-amber-300 font-bold">
                    {userInput || userProfile.phone_number}
                  </div>
                </div>
              )}

              {sessionState === 'MENU_WITHDRAW_AMT' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <div className="text-amber-400 font-bold text-[11px]">Withdraw to MoMo</div>
                  <p className="text-slate-300">Enter amount in RWF:</p>
                  <div className="bg-slate-900 px-3 py-1.5 rounded border border-amber-500/40 text-amber-300 font-bold">
                    {userInput || tempAmount} RWF
                  </div>
                </div>
              )}

              {sessionState === 'MENU_WITHDRAW_PIN' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <div className="text-amber-400 font-bold text-[11px]">Confirm MoMo Payout</div>
                  <p className="text-slate-300">Enter your 4-digit PIN to release funds:</p>
                  <div className="bg-slate-900 px-3 py-1 rounded border border-amber-500/40 text-amber-300 font-bold text-center tracking-widest">
                    {userInput ? '••••' : '1234'}
                  </div>
                </div>
              )}

              {sessionState === 'MENU_WITHDRAW_SUCCESS' && (
                <div className="space-y-1.5 text-center py-2 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                  <div className="text-emerald-400 font-bold text-xs">Payout Dispatched!</div>
                  <p className="text-slate-300 text-[11px]">
                    Sent <strong>{parseFloat(tempAmount).toLocaleString()} RWF</strong> to {tempPhone}.
                  </p>
                  <p className="text-[10px] text-slate-400">Disbursed via Go Connector Gateway.</p>
                </div>
              )}

              {/* FX Swap Flow */}
              {sessionState === 'MENU_SWAP_TYPE' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <div className="text-amber-400 font-bold text-[11px]">Instant FX Swap (*951*4#)</div>
                  <p className="text-slate-300">Select currency pair:</p>
                  <p className="text-slate-300">1. RWF -&gt; USDT (Rate: 1 USDT = 1,380 RWF)</p>
                  <p className="text-slate-300">2. USDT -&gt; RWF</p>
                  <p className="text-slate-300">3. RWF -&gt; Bitcoin (BTC)</p>
                  <div className="bg-slate-900 px-3 py-1 rounded border border-amber-500/40 text-amber-300 font-bold w-16 text-center">
                    {userInput || '1'}
                  </div>
                </div>
              )}

              {sessionState === 'MENU_SWAP_AMT' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <div className="text-amber-400 font-bold text-[11px]">Instant FX Swap</div>
                  <p className="text-slate-300">Enter amount to convert:</p>
                  <div className="bg-slate-900 px-3 py-1.5 rounded border border-amber-500/40 text-amber-300 font-bold">
                    {userInput || '138000'} {tempSwapType === '2' ? 'USDT' : 'RWF'}
                  </div>
                </div>
              )}

              {sessionState === 'MENU_SWAP_SUCCESS' && (
                <div className="space-y-1.5 text-center py-2 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                  <div className="text-emerald-400 font-bold text-xs">FX Swap Executed!</div>
                  <p className="text-slate-300 text-[11px]">Settled instantly into destination wallet.</p>
                  <p className="text-[10px] text-slate-400">Balanced 2-legged entry written to Rust Ledger.</p>
                </div>
              )}

              {/* B2B Merchant Flow */}
              {sessionState === 'MENU_MERCHANT_CODE' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <div className="text-amber-400 font-bold text-[11px]">Pay B2B Merchant (*951*5#)</div>
                  <p className="text-slate-300">Enter 5-digit Merchant Code (e.g. 95120):</p>
                  <div className="bg-slate-900 px-3 py-1.5 rounded border border-amber-500/40 text-amber-300 font-bold">
                    {userInput || '95120'}
                  </div>
                </div>
              )}

              {sessionState === 'MENU_MERCHANT_AMT' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <div className="text-amber-400 font-bold text-[11px]">Pay Merchant: Kigali Logistics</div>
                  <p className="text-slate-300">Enter Amount in RWF:</p>
                  <div className="bg-slate-900 px-3 py-1.5 rounded border border-amber-500/40 text-amber-300 font-bold">
                    {userInput || '15000'} RWF
                  </div>
                </div>
              )}

              {sessionState === 'MENU_MERCHANT_PIN' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <div className="text-amber-400 font-bold text-[11px]">Authorize Merchant Payment</div>
                  <p className="text-slate-300">Enter your 4-digit PIN:</p>
                  <div className="bg-slate-900 px-3 py-1 rounded border border-amber-500/40 text-amber-300 font-bold text-center tracking-widest">
                    {userInput ? '••••' : '1234'}
                  </div>
                </div>
              )}

              {sessionState === 'MENU_MERCHANT_SUCCESS' && (
                <div className="space-y-1.5 text-center py-2 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                  <div className="text-emerald-400 font-bold text-xs">Merchant Invoice Paid!</div>
                  <p className="text-slate-300 text-[11px]">Invoice status updated to PAID on B2B Portal.</p>
                </div>
              )}

              {/* Mining Rewards Flow */}
              {sessionState === 'MENU_MINING_CHOICE' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <div className="text-amber-400 font-bold text-[11px]">Mining Stratum Payout (*951*6#)</div>
                  <p className="text-slate-300">Available Mined Rewards: +0.01637 BTC</p>
                  <p className="text-slate-300">1. Settle to MoMo Phone (+250 {userProfile.phone_number})</p>
                  <p className="text-slate-300">2. Settle to Bitcoin Vault</p>
                  <div className="bg-slate-900 px-3 py-1 rounded border border-amber-500/40 text-amber-300 font-bold w-16 text-center">
                    {userInput || '1'}
                  </div>
                </div>
              )}

              {sessionState === 'MENU_MINING_SUCCESS' && (
                <div className="space-y-1.5 text-center py-2 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                  <div className="text-emerald-400 font-bold text-xs">Mining Rewards Credited!</div>
                  <p className="text-slate-300 text-[11px]">On-chain verified block rewards settled.</p>
                </div>
              )}

              {/* Ledger Proof Screen */}
              {sessionState === 'MENU_LEDGER_PROOF' && (
                <div className="space-y-1.5 text-[11px] animate-in fade-in">
                  <div className="text-amber-400 font-bold">Ledger Merkle Root (*951*7#)</div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800 text-[10px] break-all text-emerald-400 font-mono">
                    {merkleRoot}
                  </div>
                  <p className="text-[10px] text-slate-300">
                    Status: <strong className="text-emerald-400">100% Cryptographically Valid</strong>
                  </p>
                  <p className="text-[10px] text-slate-400">0. Back to Main Menu</p>
                </div>
              )}
            </div>

            {/* Input Action Bar */}
            <div className="pt-2 border-t border-slate-900 flex items-center gap-2">
              <input
                type="text"
                value={sessionState === 'DIALER' ? dialedString : userInput}
                onChange={(e) => {
                  if (sessionState === 'DIALER') setDialedString(e.target.value);
                  else setUserInput(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (sessionState === 'DIALER') handleSendCall();
                    else handleSubmitSessionInput();
                  }
                }}
                placeholder={sessionState === 'DIALER' ? '*951#' : 'Type option number...'}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-mono focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={() => {
                  if (sessionState === 'DIALER') handleSendCall();
                  else handleSubmitSessionInput();
                }}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                {sessionState === 'DIALER' ? 'DIAL' : 'SEND'}
              </button>
            </div>
          </div>

          {/* Quick Dial Shortcuts */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-400">Quick USSD Shortcuts:</div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { code: '*951#', label: 'Master Menu' },
                { code: '*951*1#', label: 'Balance' },
                { code: '*951*2#', label: 'MoMo Deposit' },
                { code: '*951*3#', label: 'MoMo Payout' },
                { code: '*951*4#', label: 'FX Swap' },
                { code: '*951*5#', label: 'Pay Merchant' },
                { code: '*951*6#', label: 'Mining Payout' }
              ].map((item) => (
                <button
                  key={item.code}
                  onClick={() => {
                    setDialedString(item.code);
                    setSessionState('DIALER');
                  }}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  <strong className="text-amber-400">{item.code}</strong> {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Physical Style Dial Pad */}
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
              <button
                key={key}
                onClick={() => handleDialPress(key)}
                className="py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-sm font-bold text-slate-200 transition-colors active:scale-95 cursor-pointer"
              >
                {key}
              </button>
            ))}
          </div>

          {/* Call & Control Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleClear}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Clear
            </button>
            <button
              onClick={handleSendCall}
              className="py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call *951#</span>
            </button>
            <button
              onClick={handleBackspace}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
