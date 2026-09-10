import React, { useState } from 'react';
import {
  Send,
  Plus,
  Star,
  Trash2,
  Edit2,
  Smartphone,
  Wallet,
  Building2,
  User,
  ArrowUpRight,
  CheckCircle2,
  X,
  Zap,
  Sparkles
} from 'lucide-react';
import { QuickRecipient, Asset } from '../types';

interface QuickSendWidgetProps {
  recipients: QuickRecipient[];
  assets: Asset[];
  onSelectRecipientToSend: (recipient: QuickRecipient) => void;
  onAddRecipient: (newRecipient: Omit<QuickRecipient, 'id'>) => void;
  onDeleteRecipient: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const QuickSendWidget: React.FC<QuickSendWidgetProps> = ({
  recipients,
  assets,
  onSelectRecipientToSend,
  onAddRecipient,
  onDeleteRecipient,
  onToggleFavorite
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New recipient form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<QuickRecipient['category']>('MOBILE_MONEY');
  const [addressOrPhone, setAddressOrPhone] = useState('');
  const [assetSymbol, setAssetSymbol] = useState('RWF');
  const [defaultAmount, setDefaultAmount] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !addressOrPhone.trim()) return;

    onAddRecipient({
      name: name.trim(),
      category,
      addressOrPhone: addressOrPhone.trim(),
      assetSymbol,
      defaultAmount: defaultAmount ? parseFloat(defaultAmount) : undefined,
      isFavorite: true,
      lastSentAt: new Date().toISOString()
    });

    setName('');
    setAddressOrPhone('');
    setDefaultAmount('');
    setIsAddModalOpen(false);
  };

  const getCategoryIcon = (cat: QuickRecipient['category']) => {
    switch (cat) {
      case 'MOBILE_MONEY':
        return <Smartphone className="w-3.5 h-3.5 text-emerald-400" />;
      case 'CRYPTO_WALLET':
        return <Wallet className="w-3.5 h-3.5 text-amber-400" />;
      case 'BANK_ACCOUNT':
        return <Building2 className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <User className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  // Sort favorites first
  const sortedRecipients = [...recipients].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return 0;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
      {/* Widget Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <span>Quick Send Recipients</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                1-Click Transfer
              </span>
            </h3>
            <p className="text-xs text-slate-400">Send money instantly to frequent contacts & saved wallets</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/10 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Frequent Recipients Cards Carousel / Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {sortedRecipients.map((rec) => {
          const assetObj = assets.find((a) => a.symbol === rec.assetSymbol);
          const initials = rec.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

          return (
            <div
              key={rec.id}
              className="group bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-amber-500/40 p-3.5 rounded-2xl transition-all flex flex-col justify-between relative shadow-sm"
            >
              {/* Star Favorite Button */}
              <button
                type="button"
                onClick={() => onToggleFavorite(rec.id)}
                className="absolute top-2.5 right-2.5 text-slate-600 hover:text-amber-400 transition-colors"
                title={rec.isFavorite ? 'Unstar contact' : 'Star as favorite'}
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    rec.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                  }`}
                />
              </button>

              <div className="space-y-2">
                {/* Avatar Badge */}
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-300 text-xs shadow-inner">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="font-bold text-white text-xs truncate" title={rec.name}>
                      {rec.name}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                      {getCategoryIcon(rec.category)}
                      <span className="truncate">{rec.addressOrPhone}</span>
                    </div>
                  </div>
                </div>

                {/* Amount / Asset Hint */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono">
                    {rec.defaultAmount ? (
                      <span className="text-emerald-400 font-bold">
                        {rec.defaultAmount.toLocaleString()} {rec.assetSymbol}
                      </span>
                    ) : (
                      <span className="text-slate-500">{rec.assetSymbol} Wallet</span>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase">{assetObj?.icon || rec.assetSymbol}</span>
                </div>
              </div>

              {/* 1-Click Send Button */}
              <div className="mt-3 pt-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelectRecipientToSend(rec)}
                  className="flex-1 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>Send</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteRecipient(rec.id)}
                  className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Remove recipient"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Recipient Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Save New Frequent Recipient</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Contact Name / Title</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Claudine Umutoni or Tech Vendor"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="MOBILE_MONEY">Mobile Money (MoMo)</option>
                    <option value="CRYPTO_WALLET">Crypto Wallet Address</option>
                    <option value="BANK_ACCOUNT">Bank Account</option>
                    <option value="KOFI_P2P">KOFI User ID</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Currency Asset</label>
                  <select
                    value={assetSymbol}
                    onChange={(e) => setAssetSymbol(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    {assets.map((a) => (
                      <option key={a.symbol} value={a.symbol}>
                        {a.symbol} ({a.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Phone Number or Wallet Address</label>
                <input
                  type="text"
                  value={addressOrPhone}
                  onChange={(e) => setAddressOrPhone(e.target.value)}
                  placeholder="e.g. 0788123456 or 0x71C7..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Default Amount (Optional)</label>
                <input
                  type="number"
                  value={defaultAmount}
                  onChange={(e) => setDefaultAmount(e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer"
                >
                  Save Recipient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
