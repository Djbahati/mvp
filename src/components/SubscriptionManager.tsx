import React, { useState } from 'react';
import {
  Calendar,
  Sparkles,
  Zap,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  RefreshCw,
  Check,
  Building2,
  Wifi,
  Laptop,
  Coins,
  AlertCircle,
  X,
  CreditCard,
  Edit2,
  CalendarCheck,
  ShieldAlert,
  Bell,
  BellRing
} from 'lucide-react';
import { SubscriptionRule, Asset } from '../types';
import { autoPopulateGoogleCalendarWithReminders, RecurringPaymentPattern } from '../services/recurringPaymentService';
import { signInWithGoogleCalendar, getCachedAccessToken } from '../services/googleAuth';
import {
  requestNotificationPermission,
  getNotificationPermissionStatus,
  testSubscriptionNotification
} from '../services/subscriptionNotificationService';

interface SubscriptionManagerProps {
  subscriptions: SubscriptionRule[];
  assets: Asset[];
  onAddSubscription: (rule: Omit<SubscriptionRule, 'id' | 'createdAt'>) => void;
  onUpdateSubscription?: (updatedRule: SubscriptionRule) => void;
  onDeleteSubscription: (id: string) => void;
  onToggleSubscription: (id: string) => void;
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  subscriptions,
  assets,
  onAddSubscription,
  onUpdateSubscription,
  onDeleteSubscription,
  onToggleSubscription
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(subscriptions.filter((s) => s.isEnabled).map((s) => s.id))
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | null>(null);

  // Default Calendar & Time Settings State
  const [calendarConfig, setCalendarConfig] = useState(() => {
    const saved = localStorage.getItem('kofi_default_calendar_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      calendarId: 'primary',
      calendarName: 'Primary Google Calendar Account',
      defaultExecutionTime: '09:00',
      timezone: 'Africa/Kigali (CAT UTC+2)',
      reminderLeadTime: 'SAME_DAY_0900'
    };
  });

  const [configSavedMsg, setConfigSavedMsg] = useState<string | null>(null);

  // Browser Notification System State
  const [notificationPerm, setNotificationPerm] = useState<NotificationPermission | 'unsupported'>(getNotificationPermissionStatus());
  const [notifTestMsg, setNotifTestMsg] = useState<string | null>(null);

  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotificationPerm(perm);
    if (perm === 'granted') {
      setNotifTestMsg('Browser notifications enabled! You will receive alerts 24 hours before recurring payments are due.');
    } else {
      setNotifTestMsg('Notification permission was denied. Please allow notifications in browser settings.');
    }
    setTimeout(() => setNotifTestMsg(null), 5000);
  };

  const handleTestNotification = (rule: SubscriptionRule) => {
    const success = testSubscriptionNotification(rule);
    if (success || Notification.permission === 'granted') {
      setNotifTestMsg(`Triggered test 24h notification for "${rule.title}"!`);
      setTimeout(() => setNotifTestMsg(null), 4000);
    } else {
      setNotifTestMsg('Please enable browser notifications first using the button above.');
      setTimeout(() => setNotifTestMsg(null), 4000);
    }
  };

  // Form State for New Subscription Rule
  const [formData, setFormData] = useState({
    title: '',
    provider: '',
    amount: '10000',
    assetSymbol: 'RWF',
    frequency: 'MONTHLY' as 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY',
    category: 'UTILITY' as SubscriptionRule['category'],
    nextPaymentDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    executionTime: calendarConfig.defaultExecutionTime,
    calendarId: calendarConfig.calendarId,
    notes: '',
    autoPayEnabled: false
  });

  const handleSaveCalendarConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('kofi_default_calendar_config', JSON.stringify(calendarConfig));
    setConfigSavedMsg('Default Calendar & Time configuration saved successfully!');
    setTimeout(() => setConfigSavedMsg(null), 4000);
  };

  const toggleSelectRule = (id: string) => {
    setSelectedIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === subscriptions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(subscriptions.map((s) => s.id)));
    }
  };

  // Convert SubscriptionRule to RecurringPaymentPattern
  const mapRuleToPattern = (rule: SubscriptionRule): RecurringPaymentPattern => {
    let rrule = 'RRULE:FREQ=MONTHLY;INTERVAL=1';
    if (rule.frequency === 'WEEKLY') rrule = 'RRULE:FREQ=WEEKLY;INTERVAL=1';
    if (rule.frequency === 'BIWEEKLY') rrule = 'RRULE:FREQ=WEEKLY;INTERVAL=2';

    return {
      id: `pattern_sub_${rule.id}`,
      title: `🔄 Payment Reminder: ${rule.title}`,
      destination: rule.provider,
      tx_type: 'B2B_PAYMENT',
      amount: rule.amount,
      asset_symbol: rule.assetSymbol,
      frequency: rule.frequency,
      lastPaymentDate: rule.startDate,
      predictedNextDate: rule.nextPaymentDate,
      executionTime: rule.executionTime || calendarConfig.defaultExecutionTime,
      calendarId: rule.calendarId || calendarConfig.calendarId,
      confidence: 'HIGH',
      occurrences: 1,
      rrule,
      description: `${rule.notes || rule.title} (${rule.amount} ${rule.assetSymbol}). Provider: ${rule.provider}. Scheduled at ${rule.executionTime || '09:00'} via Kofi Wallet.`,
      location: rule.provider,
      category:
        rule.category === 'MOBILE_MONEY'
          ? 'MOBILE_MONEY'
          : rule.category === 'B2B_INVOICE'
          ? 'B2B_INVOICE'
          : rule.category === 'TREASURY'
          ? 'TREASURY'
          : 'MERCHANT'
    };
  };

  // Trigger Google Calendar Population for Selected Rules
  const handlePopulateCalendar = async (rulesToSync: SubscriptionRule[]) => {
    if (rulesToSync.length === 0) return;

    setIsSyncingCalendar(true);
    setSyncSuccessMsg(null);
    setSyncErrorMsg(null);

    try {
      let token = getCachedAccessToken();
      if (!token) {
        const authResult = await signInWithGoogleCalendar();
        if (authResult?.accessToken) {
          token = authResult.accessToken;
        } else {
          throw new Error('Google Calendar access token is required.');
        }
      }

      const patterns = rulesToSync.map(mapRuleToPattern);
      const res = await autoPopulateGoogleCalendarWithReminders(token, patterns);

      if (res.successCount > 0) {
        setSyncSuccessMsg(
          `Successfully added ${res.successCount} subscription reminder${
            res.successCount > 1 ? 's' : ''
          } to your primary Google Calendar account!`
        );

        // Update lastCalendarSyncedAt
        const nowStr = new Date().toISOString();
        rulesToSync.forEach((rule) => {
          if (onUpdateSubscription) {
            onUpdateSubscription({ ...rule, lastCalendarSyncedAt: nowStr });
          }
        });
      } else {
        setSyncErrorMsg(`Calendar population failed: ${res.errors.join(', ')}`);
      }
    } catch (err: any) {
      console.error('Calendar sync error:', err);
      setSyncErrorMsg(err?.message || 'Could not sync subscription reminders to Google Calendar.');
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  // Submit New Subscription Form
  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.provider.trim()) return;

    const numAmt = parseFloat(formData.amount) || 0;
    const nowStr = new Date().toISOString();

    onAddSubscription({
      title: formData.title.trim(),
      provider: formData.provider.trim(),
      amount: numAmt,
      assetSymbol: formData.assetSymbol,
      frequency: formData.frequency,
      category: formData.category,
      startDate: nowStr,
      nextPaymentDate: formData.nextPaymentDate,
      executionTime: formData.executionTime || calendarConfig.defaultExecutionTime,
      calendarId: formData.calendarId || calendarConfig.calendarId,
      isEnabled: true,
      autoPayEnabled: formData.autoPayEnabled,
      notes: formData.notes.trim()
    });

    setIsModalOpen(false);
    setFormData({
      title: '',
      provider: '',
      amount: '10000',
      assetSymbol: 'RWF',
      frequency: 'MONTHLY',
      category: 'UTILITY',
      nextPaymentDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      executionTime: calendarConfig.defaultExecutionTime,
      calendarId: calendarConfig.calendarId,
      notes: '',
      autoPayEnabled: false
    });
  };

  const selectedRulesList = subscriptions.filter((s) => selectedIds.has(s.id));

  // Category Badge Icon map
  const getCategoryIcon = (cat: SubscriptionRule['category']) => {
    switch (cat) {
      case 'UTILITY':
        return <Wifi className="w-4 h-4 text-emerald-400" />;
      case 'SOFTWARE':
        return <Laptop className="w-4 h-4 text-sky-400" />;
      case 'B2B_INVOICE':
        return <Building2 className="w-4 h-4 text-amber-400" />;
      default:
        return <CreditCard className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-white">Manage Subscriptions & Recurring Rules</h3>
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                {subscriptions.length} Active Rules
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Define custom recurring payment schedules to automatically populate Google Calendar reminders and set auto-settlements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            className={`px-3.5 py-2.5 border text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              showConfigPanel
                ? 'bg-slate-800 border-amber-500/50 text-amber-400'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
            title="Configure target Google Calendar and default payment execution time"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Calendar & Time Settings</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/10 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subscription Rule</span>
          </button>

          <button
            onClick={() => handlePopulateCalendar(selectedRulesList)}
            disabled={isSyncingCalendar || selectedRulesList.length === 0}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl shadow-lg transition-all inline-flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isSyncingCalendar ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Populating Calendar...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Populate Google Calendar ({selectedRulesList.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Browser Notification Status & 24h Alert Banner */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <BellRing className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">24h Browser Push Notification System</h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                notificationPerm === 'granted'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : notificationPerm === 'denied'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {notificationPerm === 'granted' ? 'Active & Enabled' : notificationPerm === 'denied' ? 'Permission Denied' : 'Action Required'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Receive native browser push alerts exactly 24 hours before your recurring subscription payments are due.
            </p>
          </div>
        </div>

        {notificationPerm !== 'granted' ? (
          <button
            onClick={handleEnableNotifications}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Bell className="w-4 h-4" />
            <span>Enable 24h Push Notifications</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            <span>Notifications Active</span>
          </div>
        )}
      </div>

      {notifTestMsg && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3.5 rounded-xl text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="font-semibold">{notifTestMsg}</span>
          </div>
          <button onClick={() => setNotifTestMsg(null)} className="text-amber-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sync Status Notifications */}
      {configSavedMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{configSavedMsg}</span>
          </div>
          <button onClick={() => setConfigSavedMsg(null)} className="text-emerald-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Calendar & Execution Time Settings Configuration Panel */}
      {showConfigPanel && (
        <form onSubmit={handleSaveCalendarConfig} className="bg-slate-950 border border-amber-500/30 rounded-2xl p-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <h4 className="text-sm font-extrabold text-white">Default Calendar & Scheduled Execution Time Settings</h4>
            </div>
            <button
              type="button"
              onClick={() => setShowConfigPanel(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Set your preferred target Google Calendar account and execution time for recurring payment reminders managed directly within this panel (outside the main Calendar page).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Target Google Calendar</label>
              <select
                value={calendarConfig.calendarId}
                onChange={(e) => {
                  const val = e.target.value;
                  let name = 'Primary Google Calendar Account';
                  if (val === 'personal_finance') name = 'Personal Finance & Bills Calendar';
                  if (val === 'work_calendar') name = 'Work & Operations Calendar';
                  if (val === 'kofi_vault') name = 'Kofi Treasury Vault Calendar';
                  setCalendarConfig({ ...calendarConfig, calendarId: val, calendarName: name });
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
              >
                <option value="primary" className="bg-slate-900">Primary Calendar (bahatipeterbrumbruce@gmail.com)</option>
                <option value="personal_finance" className="bg-slate-900">Personal Finance & Bills Calendar</option>
                <option value="work_calendar" className="bg-slate-900">Work & Corporate Operations</option>
                <option value="kofi_vault" className="bg-slate-900">Kofi Treasury & Multi-Sig Vault</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Default Reminder Execution Time</label>
              <input
                type="time"
                value={calendarConfig.defaultExecutionTime}
                onChange={(e) => setCalendarConfig({ ...calendarConfig, defaultExecutionTime: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Default Timezone</label>
              <select
                value={calendarConfig.timezone}
                onChange={(e) => setCalendarConfig({ ...calendarConfig, timezone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
              >
                <option value="Africa/Kigali (CAT UTC+2)" className="bg-slate-900">Africa/Kigali (CAT UTC+2)</option>
                <option value="UTC" className="bg-slate-900">Coordinated Universal Time (UTC)</option>
                <option value="Europe/London (GMT)" className="bg-slate-900">Europe/London (GMT/BST)</option>
                <option value="America/New_York (EST)" className="bg-slate-900">America/New_York (EST/EDT)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500">Settings save to local profile and apply automatically to all synced rules.</span>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg cursor-pointer"
            >
              Save Defaults
            </button>
          </div>
        </form>
      )}

      {syncSuccessMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{syncSuccessMsg}</span>
          </div>
          <button onClick={() => setSyncSuccessMsg(null)} className="text-emerald-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {syncErrorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{syncErrorMsg}</span>
          </div>
          <button onClick={() => setSyncErrorMsg(null)} className="text-rose-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selection Control Bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <button
          onClick={toggleSelectAll}
          className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <div
            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
              selectedIds.size === subscriptions.length && subscriptions.length > 0
                ? 'bg-amber-500 border-amber-500 text-slate-950'
                : 'border-slate-700'
            }`}
          >
            {selectedIds.size === subscriptions.length && subscriptions.length > 0 && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
          <span>
            {selectedIds.size === subscriptions.length && subscriptions.length > 0 ? 'Deselect All' : 'Select All for Calendar Sync'}
          </span>
        </button>

        <span>{selectedIds.size} of {subscriptions.length} selected for calendar population</span>
      </div>

      {/* Grid List of Defined Subscription Rules */}
      {subscriptions.length === 0 ? (
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">No Subscription Rules Defined</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Create custom recurring payment rules (utility bills, cloud hosting, office rent, B2B invoices) to trigger automated Google Calendar reminders.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Rule</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {subscriptions.map((rule) => {
            const isSelected = selectedIds.has(rule.id);
            const nextDate = new Date(rule.nextPaymentDate);

            return (
              <div
                key={rule.id}
                className={`border rounded-2xl p-4 transition-all space-y-3 relative ${
                  isSelected
                    ? 'bg-slate-950/90 border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : 'bg-slate-950/40 border-slate-800/80 opacity-75 hover:opacity-100'
                } ${!rule.isEnabled ? 'opacity-50 grayscale' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() => toggleSelectRule(rule.id)}
                      className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center transition-colors cursor-pointer border ${
                        isSelected
                          ? 'bg-amber-500 border-amber-500 text-slate-950'
                          : 'border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-slate-900 border border-slate-800">
                          {getCategoryIcon(rule.category)}
                        </span>
                        <h4 className="text-sm font-extrabold text-white leading-snug">{rule.title}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">Provider: {rule.provider}</p>
                    </div>
                  </div>

                  {/* Frequency Badge */}
                  <span className="px-2 py-0.5 bg-slate-900 text-amber-400 border border-slate-800 text-[10px] font-mono font-bold rounded-lg uppercase shrink-0">
                    {rule.frequency}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1 font-mono">
                  <div className="text-lg font-black text-amber-400">
                    {rule.amount.toLocaleString()} <span className="text-xs font-bold text-slate-300">{rule.assetSymbol}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Next Due Date & Time:</span>
                    <span className="text-xs font-bold text-white flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3 text-amber-400 inline" />
                      {nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} @ {rule.executionTime || '09:00'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] bg-slate-900/60 px-2.5 py-1.5 rounded-xl border border-slate-800/60 text-slate-400 font-medium">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Calendar className="w-3 h-3 text-amber-400" />
                    Target: {rule.calendarId === 'personal_finance' ? 'Personal Finance' : rule.calendarId === 'work_calendar' ? 'Work & Ops' : rule.calendarId === 'kofi_vault' ? 'Kofi Vault' : 'Primary Calendar'}
                  </span>
                  <span className="font-mono text-amber-400 font-bold">{rule.executionTime || '09:00'} CAT</span>
                </div>

                {rule.notes && (
                  <p className="text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded-xl border border-slate-800/80 line-clamp-2">
                    {rule.notes}
                  </p>
                )}

                {/* Footer Controls */}
                <div className="pt-2.5 border-t border-slate-900 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleSubscription(rule.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                        rule.isEnabled
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {rule.isEnabled ? 'Active' : 'Paused'}
                    </button>

                    {rule.lastCalendarSyncedAt && (
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Synced
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestNotification(rule)}
                      className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      title="Test 24-hour browser notification reminder"
                    >
                      <Bell className="w-3 h-3" />
                      <span>Test 24h</span>
                    </button>

                    <button
                      onClick={() => handlePopulateCalendar([rule])}
                      disabled={isSyncingCalendar}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 text-[10px] font-bold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Calendar className="w-3 h-3 text-amber-400" />
                      <span>Sync Calendar</span>
                    </button>

                    <button
                      onClick={() => onDeleteSubscription(rule.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete Subscription Rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Creating New Subscription Rule */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <span>Add Recurring Payment Rule</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Rule / Subscription Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Office Fibre Broadband Internet"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Provider / Recipient Destination <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  placeholder="e.g., MTN Rwanda (*951#)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Asset</label>
                  <select
                    value={formData.assetSymbol}
                    onChange={(e) => setFormData({ ...formData, assetSymbol: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none"
                  >
                    {assets.map((a) => (
                      <option key={a.symbol} value={a.symbol} className="bg-slate-900">
                        {a.symbol} - {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) =>
                      setFormData({ ...formData, frequency: e.target.value as 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY' })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none"
                  >
                    <option value="MONTHLY" className="bg-slate-900">Monthly</option>
                    <option value="BIWEEKLY" className="bg-slate-900">Bi-Weekly</option>
                    <option value="WEEKLY" className="bg-slate-900">Weekly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as SubscriptionRule['category'] })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none"
                  >
                    <option value="UTILITY" className="bg-slate-900">Utility / Telecom</option>
                    <option value="SOFTWARE" className="bg-slate-900">Software / Cloud</option>
                    <option value="B2B_INVOICE" className="bg-slate-900">B2B Lease / Invoice</option>
                    <option value="MOBILE_MONEY" className="bg-slate-900">Mobile Money (*951#)</option>
                    <option value="TREASURY" className="bg-slate-900">Treasury Vault</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Next Payment Date</label>
                  <input
                    type="date"
                    required
                    value={formData.nextPaymentDate}
                    onChange={(e) => setFormData({ ...formData, nextPaymentDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Execution Time</label>
                  <input
                    type="time"
                    required
                    value={formData.executionTime}
                    onChange={(e) => setFormData({ ...formData, executionTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Target Google Calendar Account</label>
                <select
                  value={formData.calendarId}
                  onChange={(e) => setFormData({ ...formData, calendarId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="primary" className="bg-slate-900">Primary Google Calendar (bahatipeterbrumbruce@gmail.com)</option>
                  <option value="primary" className="bg-slate-900">Personal Finance & Bills (Synced to Primary)</option>
                  <option value="primary" className="bg-slate-900">Work & Operations (Synced to Primary)</option>
                  <option value="primary" className="bg-slate-900">Kofi Treasury & Multi-Sig Vault (Synced to Primary)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Notes / Description (Optional)</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional context or account numbers..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg cursor-pointer"
                >
                  Save Subscription Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
