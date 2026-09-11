import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  ExternalLink,
  Clock,
  MapPin,
  RefreshCw,
  LogOut,
  AlertCircle,
  CheckCircle2,
  CalendarCheck,
  Building2,
  Smartphone,
  ShieldCheck,
  Zap,
  Repeat,
  Sparkles,
  TrendingUp,
  Check,
  History,
  Database,
  Sliders,
  ChevronDown,
  ChevronUp,
  Terminal,
  Globe,
  Copy,
  AlertTriangle
} from 'lucide-react';
import { Transaction, SubscriptionRule } from '../types';
import {
  signInWithGoogleCalendar,
  getCachedAccessToken,
  logoutGoogle,
  initGoogleAuth,
  setCachedAccessToken
} from '../services/googleAuth';
import {
  listCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  CalendarEvent
} from '../services/calendarService';
import {
  detectRecurringPaymentPatterns,
  autoPopulateGoogleCalendarWithReminders,
  RecurringPaymentPattern
} from '../services/recurringPaymentService';
import {
  saveCalendarEventsToIDB,
  getCalendarEventsFromIDB,
  saveRecurringPatternsToIDB,
  getRecurringPatternsFromIDB,
  saveSyncHealthMeta,
  getSyncHealthMeta,
  recordSyncHistoryLog,
  getSyncHistoryLogs,
  SyncHealthMeta,
  SyncHistoryLogItem
} from '../services/indexedDbService';

interface GoogleCalendarViewProps {
  transactions?: Transaction[];
  subscriptions?: SubscriptionRule[];
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const GoogleCalendarView: React.FC<GoogleCalendarViewProps> = ({
  transactions = [],
  subscriptions = [],
  onNotify
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getCachedAccessToken());
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync Health Indicator State
  const [syncStatus, setSyncStatus] = useState<'SYNCED' | 'RETRYING' | 'ERROR' | 'OFFLINE'>('SYNCED');
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);
  const [cachedEventsCount, setCachedEventsCount] = useState<number>(0);

  // Sync History Log & Subscription Manager Re-sync State
  const [syncHistoryLogs, setSyncHistoryLogs] = useState<SyncHistoryLogItem[]>([]);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(true);
  const [isSyncingSubscriptions, setIsSyncingSubscriptions] = useState<boolean>(false);

  const loadSyncHistory = async () => {
    const logs = await getSyncHistoryLogs();
    setSyncHistoryLogs(logs);
  };

  // Sync state initialization from IndexedDB metadata
  useEffect(() => {
    getSyncHealthMeta().then((meta) => {
      if (meta) {
        if (meta.lastSyncedAt) setLastSyncedTime(meta.lastSyncedAt);
        if (meta.cachedEventsCount) setCachedEventsCount(meta.cachedEventsCount);
      }
    });

    // Attempt to pre-load cached events from IndexedDB
    getCalendarEventsFromIDB().then((cached) => {
      if (cached && cached.length > 0) {
        setEvents(cached);
        setCachedEventsCount(cached.length);
      }
    });

    loadSyncHistory();
  }, []);

  // Recurring Reminders State
  const [recurringPatterns, setRecurringPatterns] = useState<RecurringPaymentPattern[]>([]);
  const [selectedPatternIds, setSelectedPatternIds] = useState<Set<string>>(new Set());
  const [isAutoPopulating, setIsAutoPopulating] = useState<boolean>(false);
  const [autoPopulateSuccessMsg, setAutoPopulateSuccessMsg] = useState<string | null>(null);
  const [populateErrorMsg, setPopulateErrorMsg] = useState<string | null>(null);
  const [populateErrorList, setPopulateErrorList] = useState<string[]>([]);
  const [lastAttemptedPatterns, setLastAttemptedPatterns] = useState<RecurringPaymentPattern[]>([]);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isDiagnosticsModalOpen, setIsDiagnosticsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [summary, setSummary] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() + 3600000).toISOString().slice(0, 16)
  );
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 7200000).toISOString().slice(0, 16)
  );

  // Confirmation Delete State
  const [deletingEvent, setDeletingEvent] = useState<CalendarEvent | null>(null);

  // Filter
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'ALL' | 'URGENT_48H' | 'FINANCIAL' | 'UPCOMING'>('ALL');

  /**
   * Calculates whether a predicted due date is within the next 48 hours
   */
  const getDueHoursStatus = (dateStr: string) => {
    if (!dateStr) return { isDueWithin48h: false, hoursLeft: 999, label: '', isOverdue: false };
    const now = new Date();
    const dueDate = new Date(dateStr);

    // If dateStr is YYYY-MM-DD, set to 23:59:59 for proper end-of-day math
    if (!dateStr.includes('T')) {
      dueDate.setHours(23, 59, 59, 999);
    }

    const diffMs = dueDate.getTime() - now.getTime();
    const hoursLeft = Math.round(diffMs / (1000 * 60 * 60));

    const isOverdue = diffMs < 0;
    // Due within 48 hours (or slightly overdue up to -24 hours)
    const isDueWithin48h = diffMs <= 48 * 3600 * 1000 && diffMs >= -24 * 3600 * 1000;

    let label = '';
    if (isOverdue) {
      const absHours = Math.abs(hoursLeft);
      label = absHours < 1 ? 'Overdue now' : `Overdue by ${absHours}h`;
    } else if (hoursLeft < 1) {
      label = 'Due in <1h';
    } else if (hoursLeft === 1) {
      label = 'Due in 1h';
    } else if (hoursLeft <= 24) {
      label = `Due today (${hoursLeft}h left)`;
    } else {
      label = `Due in ${hoursLeft}h (${Math.ceil(hoursLeft / 24)}d)`;
    }

    return { isDueWithin48h, hoursLeft, label, isOverdue };
  };

  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setIsLoadingAuth(false);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setIsLoadingAuth(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (accessToken) {
      loadEvents(accessToken);
    }
  }, [accessToken]);

  useEffect(() => {
    const txPatterns = detectRecurringPaymentPatterns(transactions);
    const subPatterns = convertSubscriptionsToRecurringPatterns(subscriptions);

    // Combine transaction detected patterns and active subscription rules
    const combinedMap = new Map<string, RecurringPaymentPattern>();
    subPatterns.forEach((p) => combinedMap.set(p.id, p));
    txPatterns.forEach((p) => {
      if (!combinedMap.has(p.id)) combinedMap.set(p.id, p);
    });

    const combined = Array.from(combinedMap.values());
    setRecurringPatterns(combined);

    // Default select all high & medium confidence, plus anything due within 48 hours
    const defaultSelected = new Set(
      combined
        .filter((p) => p.confidence === 'HIGH' || p.confidence === 'MEDIUM' || getDueHoursStatus(p.predictedNextDate).isDueWithin48h)
        .map((p) => p.id)
    );
    setSelectedPatternIds(defaultSelected);
  }, [transactions, subscriptions]);

  const togglePatternSelection = (id: string) => {
    setSelectedPatternIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const convertSubscriptionsToRecurringPatterns = (subs: SubscriptionRule[]): RecurringPaymentPattern[] => {
    return subs
      .filter((s) => s.isEnabled)
      .map((s) => {
        const freq = s.frequency;
        const rruleFreq = freq === 'MONTHLY' ? 'MONTHLY' : 'WEEKLY';

        return {
          id: `pattern_sub_${s.id}`,
          title: `[Subscription] ${s.title}`,
          destination: s.provider,
          tx_type: 'B2B_PAYMENT' as const,
          amount: s.amount,
          asset_symbol: s.assetSymbol,
          frequency: freq,
          lastPaymentDate: s.startDate || new Date().toISOString(),
          predictedNextDate: s.nextPaymentDate || new Date().toISOString().split('T')[0],
          executionTime: s.executionTime || '09:00',
          calendarId: s.calendarId || 'primary',
          confidence: 'HIGH' as const,
          occurrences: 12,
          rrule: `RRULE:FREQ=${rruleFreq};COUNT=12`,
          description: `Subscription Manager Rule: ${s.provider}. Amount: ${s.amount} ${s.assetSymbol}. Execution Time: ${s.executionTime || '09:00'}. Notes: ${s.notes || 'None'}`,
          location: 'Kofi Mobile Money Gateway (*951#)',
          category: (s.category === 'UTILITY' ? 'MOBILE_MONEY' : 'B2B_INVOICE') as any
        };
      });
  };

  const handleReSyncSubscriptionRules = async () => {
    if (!accessToken) {
      alert('Please connect your Google Calendar account first.');
      return;
    }

    const activeRules = subscriptions.length > 0 ? subscriptions : [];
    if (activeRules.length === 0) {
      alert('No active subscription rules found in Subscription Manager.');
      return;
    }

    setIsSyncingSubscriptions(true);
    setSyncStatus('RETRYING');
    setAutoPopulateSuccessMsg(null);
    setPopulateErrorMsg(null);

    try {
      const patterns = convertSubscriptionsToRecurringPatterns(activeRules);
      const res = await autoPopulateGoogleCalendarWithReminders(
        accessToken,
        patterns,
        'primary',
        { maxRetries: 3, initialDelayMs: 800, backoffFactor: 2 }
      );

      if (res.successCount > 0) {
        const msg = `Re-synced ${res.successCount} subscription payment rule(s) with your Google Calendar!`;
        setAutoPopulateSuccessMsg(msg);
        setSyncStatus('SYNCED');
        if (onNotify) onNotify(msg, 'success');

        await recordSyncHistoryLog({
          timestamp: new Date().toISOString(),
          status: 'SUCCESS',
          source: 'SUBSCRIPTION_RE_SYNC',
          eventsCount: res.successCount,
          details: `Reconciled ${res.successCount} active subscription rule(s) from Subscription Manager to Google Calendar.`
        });

        await loadEvents(accessToken);
      } else {
        const errMsg = `Subscription re-sync failed: ${res.errors.join(', ')}`;
        setPopulateErrorMsg(errMsg);
        setSyncStatus('ERROR');

        await recordSyncHistoryLog({
          timestamp: new Date().toISOString(),
          status: 'FAILED',
          source: 'SUBSCRIPTION_RE_SYNC',
          eventsCount: 0,
          details: `Subscription re-sync failed: ${res.errors.join('; ')}`
        });
      }
    } catch (err: any) {
      console.error('Subscription re-sync error:', err);
      setSyncStatus('ERROR');
      const msg = err?.message || 'Unknown error during subscription re-sync';
      setPopulateErrorMsg(`Subscription Re-Sync Error: ${msg}`);

      await recordSyncHistoryLog({
        timestamp: new Date().toISOString(),
        status: 'FAILED',
        source: 'SUBSCRIPTION_RE_SYNC',
        eventsCount: 0,
        details: `Critical subscription sync error: ${msg}`
      });
    } finally {
      setIsSyncingSubscriptions(false);
      await loadSyncHistory();
    }
  };

  const handleBatchAutoPopulate = async (customPatterns?: RecurringPaymentPattern[]) => {
    if (!accessToken) {
      alert('Please connect your Google Calendar account first.');
      return;
    }

    const patternsToSync = customPatterns || recurringPatterns.filter((p) => selectedPatternIds.has(p.id));
    if (patternsToSync.length === 0) {
      alert('Please select at least one recurring payment pattern to populate.');
      return;
    }

    setLastAttemptedPatterns(patternsToSync);
    setIsAutoPopulating(true);
    setAutoPopulateSuccessMsg(null);
    setPopulateErrorMsg(null);
    setPopulateErrorList([]);
    setSyncStatus('RETRYING');

    try {
      const res = await autoPopulateGoogleCalendarWithReminders(
        accessToken,
        patternsToSync,
        'primary',
        { maxRetries: 3, initialDelayMs: 800, backoffFactor: 2 }
      );

      if (res.successCount > 0) {
        const msg = `Successfully created ${res.successCount} recurring payment reminder(s) in your Google Calendar!`;
        setAutoPopulateSuccessMsg(msg);
        setSyncStatus('SYNCED');
        if (onNotify) onNotify(msg, 'success');

        await recordSyncHistoryLog({
          timestamp: new Date().toISOString(),
          status: 'SUCCESS',
          source: 'RECURRING_POPULATE',
          eventsCount: res.successCount,
          details: `Populated ${res.successCount} recurring payment reminder(s) directly to primary Google Calendar.`
        });

        await loadEvents(accessToken);
      }

      if (res.failedCount > 0) {
        setPopulateErrorList(res.errors);
        const errMsg = `Failed to populate ${res.failedCount} event(s). Automatic retry with exponential backoff is available below.`;
        setPopulateErrorMsg(errMsg);
        setSyncStatus('ERROR');
        if (onNotify) onNotify(`Calendar sync incomplete (${res.failedCount} failed)`, 'error');

        await recordSyncHistoryLog({
          timestamp: new Date().toISOString(),
          status: 'PARTIAL',
          source: 'RECURRING_POPULATE',
          eventsCount: res.successCount,
          details: `Partial sync: ${res.successCount} created, ${res.failedCount} failed (${res.errors.join(', ')})`
        });
      }
    } catch (err: any) {
      console.error('Batch auto-populate error:', err);
      const msg = err?.message || 'Unknown calendar sync error';
      setPopulateErrorMsg(`Calendar Population Error: ${msg}`);
      setSyncStatus('ERROR');
      if (onNotify) onNotify(`Calendar population failed: ${msg}`, 'error');

      await recordSyncHistoryLog({
        timestamp: new Date().toISOString(),
        status: 'FAILED',
        source: 'RECURRING_POPULATE',
        eventsCount: 0,
        details: `Batch populate failed: ${msg}`
      });
    } finally {
      setIsAutoPopulating(false);
      await loadSyncHistory();
    }
  };

  const handleRetryFailedSync = async () => {
    if (lastAttemptedPatterns.length === 0) return;
    setRetryCount((prev) => prev + 1);
    setSyncStatus('RETRYING');
    await handleBatchAutoPopulate(lastAttemptedPatterns);
  };

  const handleSingleAutoPopulate = async (pattern: RecurringPaymentPattern) => {
    if (!accessToken) {
      alert('Please connect your Google Calendar account first.');
      return;
    }

    setIsAutoPopulating(true);
    setSyncStatus('RETRYING');
    try {
      const res = await autoPopulateGoogleCalendarWithReminders(
        accessToken,
        [pattern],
        'primary',
        { maxRetries: 3, initialDelayMs: 800, backoffFactor: 2 }
      );
      if (res.successCount > 0) {
        const msg = `Added "${pattern.title}" to Google Calendar!`;
        setSyncStatus('SYNCED');
        if (onNotify) onNotify(msg, 'success');
        await loadEvents(accessToken);
      } else {
        setSyncStatus('ERROR');
        alert(`Failed to populate event: ${res.errors.join(', ')}`);
      }
    } catch (err: any) {
      setSyncStatus('ERROR');
      alert('Error populating event: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsAutoPopulating(false);
    }
  };

  const loadEvents = async (token: string) => {
    setIsLoadingEvents(true);
    setErrorMsg(null);
    setSyncStatus('RETRYING');

    try {
      const fetchedEvents = await listCalendarEvents(token, 30);
      setEvents(fetchedEvents);

      const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncedTime(nowFormatted);
      setSyncStatus('SYNCED');
      setCachedEventsCount(fetchedEvents.length);

      // Save to IndexedDB for offline retrieval
      await saveCalendarEventsToIDB(fetchedEvents);
      await saveSyncHealthMeta({
        status: 'SYNCED',
        lastSyncedAt: nowFormatted,
        cachedEventsCount: fetchedEvents.length,
        cachedTxCount: transactions.length
      });

      await recordSyncHistoryLog({
        timestamp: new Date().toISOString(),
        status: 'SUCCESS',
        source: 'GOOGLE_API_FETCH',
        eventsCount: fetchedEvents.length,
        details: `Reconciled ${fetchedEvents.length} event(s) directly from Google Calendar REST API v3.`
      });
    } catch (err: any) {
      console.error('Error fetching calendar events:', err);

      // IndexedDB Fallback
      const cachedEvents = await getCalendarEventsFromIDB();
      if (cachedEvents && cachedEvents.length > 0) {
        setEvents(cachedEvents);
        setSyncStatus('OFFLINE');
        setErrorMsg('Google Calendar API unreachable. Displaying cached events from local IndexedDB storage.');
        if (onNotify) onNotify('Loaded cached calendar events from IndexedDB', 'info');

        await recordSyncHistoryLog({
          timestamp: new Date().toISOString(),
          status: 'CACHED_OFFLINE',
          source: 'OFFLINE_INDEXEDB',
          eventsCount: cachedEvents.length,
          details: `API fetch failed (${err?.message || 'Network error'}). Restored ${cachedEvents.length} cached event(s) from local IndexedDB.`
        });
      } else {
        setSyncStatus('ERROR');
        if (err?.response?.status === 401) {
          setErrorMsg('Session expired or permissions changed. Please sign in again.');
          setAccessToken(null);
          setCachedAccessToken(null);
        } else {
          setErrorMsg(err?.message || 'Failed to fetch Google Calendar events.');
        }

        await recordSyncHistoryLog({
          timestamp: new Date().toISOString(),
          status: 'FAILED',
          source: 'GOOGLE_API_FETCH',
          eventsCount: 0,
          details: `API fetch failed: ${err?.message || 'Unknown error'}`
        });
      }
    } finally {
      setIsLoadingEvents(false);
      await loadSyncHistory();
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMsg(null);
    try {
      const res = await signInWithGoogleCalendar();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        if (onNotify) onNotify('Connected to Google Calendar successfully!', 'success');
      }
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      setErrorMsg(err?.message || 'Failed to sign in with Google Calendar.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logoutGoogle();
    setUser(null);
    setAccessToken(null);
    setEvents([]);
    if (onNotify) onNotify('Signed out of Google Calendar', 'info');
  };

  const handleQuickPreset = (presetType: 'MOMO' | 'INVOICE' | 'TREASURY' | 'COMPLIANCE') => {
    const now = new Date();
    const start = new Date(now.getTime() + 24 * 3600000); // Tomorrow
    const end = new Date(now.getTime() + 25 * 3600000);

    setStartDate(start.toISOString().slice(0, 16));
    setEndDate(end.toISOString().slice(0, 16));

    if (presetType === 'MOMO') {
      setSummary('📱 MoMo Payment Settlement Reminder (*951#)');
      setDescription('Scheduled Mobile Money settlement audit and MoMo liquidity check for Kofi Wallet.');
      setLocation('Kofi Wallet App (*951#)');
    } else if (presetType === 'INVOICE') {
      setSummary('💼 B2B Invoice Payment Due Date');
      setDescription('Reminder: B2B Merchant invoice payment due for settlement via Kofi B2B Gateway.');
      setLocation('Kofi B2B Merchant Portal');
    } else if (presetType === 'TREASURY') {
      setSummary('🏛️ Multi-Sig Four-Eyes Treasury Approval');
      setDescription('Quarterly multi-signature wallet rebalancing & treasury Four-Eyes approval session.');
      setLocation('Kofi Vault & Multi-Sig Portal');
    } else if (presetType === 'COMPLIANCE') {
      setSummary('🛡️ Compliance & AML Periodic Review');
      setDescription('Scheduled KYC/AML biometric verification and risk score audit review.');
      setLocation('Kofi Compliance Center');
    }

    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (!summary.trim()) {
      alert('Please enter an event title.');
      return;
    }

    setIsSubmitting(true);
    try {
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const newEv: CalendarEvent = {
        summary: summary.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        start: { dateTime: new Date(startDate).toISOString(), timeZone: userTimeZone },
        end: { dateTime: new Date(endDate).toISOString(), timeZone: userTimeZone }
      };

      await createCalendarEvent(accessToken, newEv);
      if (onNotify) onNotify('Google Calendar event created successfully!', 'success');

      // Reset
      setSummary('');
      setDescription('');
      setLocation('');
      setIsCreateModalOpen(false);

      // Reload
      await loadEvents(accessToken);
    } catch (err: any) {
      console.error('Failed to create calendar event:', err);
      alert('Failed to create Google Calendar event: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteEvent = async () => {
    if (!accessToken || !deletingEvent || !deletingEvent.id) return;

    setIsSubmitting(true);
    try {
      await deleteCalendarEvent(accessToken, deletingEvent.id);
      if (onNotify) onNotify('Calendar event deleted', 'info');
      setDeletingEvent(null);
      await loadEvents(accessToken);
    } catch (err: any) {
      console.error('Failed to delete event:', err);
      alert('Failed to delete calendar event: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.summary?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      ev.description?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      ev.location?.toLowerCase().includes(searchFilter.toLowerCase());

    if (!matchesSearch) return false;

    if (activeCategoryFilter === 'URGENT_48H') {
      const startStr = ev.start?.dateTime || ev.start?.date;
      if (!startStr) return false;
      return getDueHoursStatus(startStr).isDueWithin48h;
    }

    if (activeCategoryFilter === 'FINANCIAL') {
      const isFin =
        ev.summary?.toLowerCase().includes('momo') ||
        ev.summary?.toLowerCase().includes('payment') ||
        ev.summary?.toLowerCase().includes('invoice') ||
        ev.summary?.toLowerCase().includes('wallet') ||
        ev.summary?.toLowerCase().includes('ledger') ||
        ev.summary?.toLowerCase().includes('treasury') ||
        ev.summary?.toLowerCase().includes('kofi');
      return isFin;
    }

    return true;
  });

  const filteredRecurringPatterns = recurringPatterns.filter((pattern) => {
    const status = getDueHoursStatus(pattern.predictedNextDate);
    if (activeCategoryFilter === 'URGENT_48H') {
      return status.isDueWithin48h;
    }
    return true;
  });

  const urgentPatternsCount = recurringPatterns.filter((p) => getDueHoursStatus(p.predictedNextDate).isDueWithin48h).length;

  if (isLoadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-sm font-medium">Connecting to Google Calendar Auth...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800/80 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
                <CalendarIcon className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                Google Workspace Integration
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                Primary Calendar Synced
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Google Calendar & Financial Schedule
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Sync financial reminders, MoMo settlements, invoice due dates, and treasury meetings directly with your Google Calendar account.
            </p>

            {/* Background Synchronization Health Indicator */}
            <div className="flex flex-wrap items-center gap-2.5 mt-3.5 pt-3 border-t border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Sync Health:
              </span>

              {syncStatus === 'SYNCED' && (
                <div
                  onClick={() => setIsDiagnosticsModalOpen(true)}
                  className="inline-flex flex-wrap items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm cursor-pointer hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all group"
                  title="Click to view Google Calendar API Diagnostics & Payload Debugger"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>SYNCED WITH GOOGLE CALENDAR</span>
                  {lastSyncedTime && (
                    <span className="text-[10px] text-emerald-300/90 font-mono border-l border-emerald-500/30 pl-2">
                      Last synced {lastSyncedTime}
                    </span>
                  )}
                  <span className="bg-emerald-950/80 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/20 ml-1 group-hover:bg-emerald-800/40 transition-colors">
                    IndexedDB Active ({cachedEventsCount} cached)
                  </span>
                  <span className="text-[10px] underline text-emerald-300/80 group-hover:text-white font-mono ml-1">
                    [Diagnostics]
                  </span>
                </div>
              )}

              {syncStatus === 'RETRYING' && (
                <div
                  onClick={() => setIsDiagnosticsModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm cursor-pointer hover:bg-amber-500/20 transition-all group"
                  title="Click to view Retry Diagnostics & API Error Details"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>RETRYING SYNC (EXPONENTIAL BACKOFF)</span>
                  {retryCount > 0 && (
                    <span className="text-[10px] text-amber-300 font-mono border-l border-amber-500/30 pl-2">
                      Attempt #{retryCount}
                    </span>
                  )}
                  <span className="text-[10px] underline text-amber-300/80 group-hover:text-white font-mono ml-1">
                    [Inspect Response]
                  </span>
                </div>
              )}

              {syncStatus === 'ERROR' && (
                <div
                  onClick={() => setIsDiagnosticsModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-3.5 py-1.5 rounded-full text-xs font-extrabold shadow-md cursor-pointer hover:bg-red-500/20 hover:border-red-500/60 transition-all group"
                  title="Click to view exact Google Calendar API error response body"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  <span>SYNC ERROR DETECTED</span>
                  <span className="bg-red-950/90 text-red-200 border border-red-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full group-hover:bg-red-900 transition-colors">
                    View Exact API Response Body ➔
                  </span>
                </div>
              )}

              {syncStatus === 'OFFLINE' && (
                <div
                  onClick={() => setIsDiagnosticsModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm cursor-pointer hover:bg-cyan-500/20 transition-all group"
                  title="Click to view Offline Cache Diagnostics"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <Zap className="w-3.5 h-3.5" />
                  <span>OFFLINE MODE (INDEXEDB CACHED)</span>
                  <span className="text-[10px] text-cyan-300 font-mono border-l border-cyan-500/30 pl-2">
                    {events.length} Events
                  </span>
                  <span className="text-[10px] underline text-cyan-300/80 group-hover:text-white font-mono ml-1">
                    [Diagnostics]
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Connection Status & Action */}
          <div className="flex items-center gap-3">
            {accessToken && user ? (
              <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-9 h-9 rounded-full border border-slate-700" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                    {user.displayName?.[0] || 'U'}
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-white leading-tight">{user.displayName || 'Google Account'}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">{user.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="ml-2 p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Disconnect Google Account"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="gsi-material-button hover:opacity-95 transition-opacity cursor-pointer shadow-lg"
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents font-medium">
                    {isSigningIn ? 'Connecting...' : 'Sign in with Google'}
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {!accessToken ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20 flex items-center justify-center mx-auto">
            <CalendarCheck className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-bold text-white">Connect Your Google Calendar</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Authenticate with your Google account to enable live synchronization of financial reminders, invoice payment dates, and MoMo settlement schedules directly into your Google Calendar.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="gsi-material-button inline-flex shadow-xl hover:opacity-90 transition-opacity"
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                </div>
                <span className="gsi-material-button-contents font-semibold">
                  {isSigningIn ? 'Connecting...' : 'Sign in with Google'}
                </span>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Quick Financial Schedule Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => handleQuickPreset('MOMO')}
              className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-xl p-4 text-left transition-all hover:border-amber-500/40 group cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-amber-400">MoMo Reminder</span>
              </div>
              <p className="text-xs font-bold text-white group-hover:text-amber-300">Schedule MoMo Settlement</p>
              <p className="text-[10px] text-slate-400 mt-1">Add Mobile Money audit to Google Calendar</p>
            </button>

            <button
              onClick={() => handleQuickPreset('INVOICE')}
              className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-xl p-4 text-left transition-all hover:border-blue-500/40 group cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 group-hover:scale-110 transition-transform">
                  <Building2 className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-blue-400">B2B Invoice</span>
              </div>
              <p className="text-xs font-bold text-white group-hover:text-blue-300">Schedule Invoice Due Date</p>
              <p className="text-[10px] text-slate-400 mt-1">Track merchant invoice payouts</p>
            </button>

            <button
              onClick={() => handleQuickPreset('TREASURY')}
              className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-xl p-4 text-left transition-all hover:border-emerald-500/40 group cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-emerald-400">Treasury Meeting</span>
              </div>
              <p className="text-xs font-bold text-white group-hover:text-emerald-300">Four-Eyes Approval Session</p>
              <p className="text-[10px] text-slate-400 mt-1">Schedule multi-sig authorization</p>
            </button>

            <button
              onClick={() => {
                setSummary('');
                setDescription('');
                setLocation('');
                setIsCreateModalOpen(true);
              }}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl p-4 text-left shadow-lg transition-all font-bold flex flex-col justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="p-2 bg-slate-950/20 rounded-lg">
                  <Plus className="w-4 h-4 text-slate-950" />
                </span>
                <span className="text-xs uppercase tracking-wider text-slate-950 font-black">Custom Event</span>
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-950">Add Calendar Event</p>
                <p className="text-[10px] text-slate-900 font-medium">Create custom schedule entry</p>
              </div>
            </button>
          </div>

          {/* Auto-Detected Recurring Payment Reminders Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white">
                      Auto-Detected Recurring Payment Reminders
                    </h3>
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      AI Transaction Analysis
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Analyzed transaction history to predict upcoming financial obligations & recurring settlements.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={handleReSyncSubscriptionRules}
                  disabled={isSyncingSubscriptions || !accessToken}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Re-sync all payment rules defined in Subscription Manager to Google Calendar"
                >
                  {isSyncingSubscriptions ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Syncing Rules...</span>
                    </>
                  ) : (
                    <>
                      <Repeat className="w-4 h-4 text-purple-200" />
                      <span>Re-Sync Subscription Rules ({subscriptions.length || 3})</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleBatchAutoPopulate()}
                  disabled={isAutoPopulating || selectedPatternIds.size === 0}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isAutoPopulating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Populating Calendar...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Auto-Populate Calendar ({selectedPatternIds.size})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {autoPopulateSuccessMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{autoPopulateSuccessMsg}</span>
              </div>
            )}

            {populateErrorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                    <div>
                      <p className="font-bold text-red-300">{populateErrorMsg}</p>
                      {retryCount > 0 && (
                        <p className="text-[10px] text-amber-400/90 mt-0.5 font-mono">
                          Retry attempt #{retryCount} with exponential backoff & payload sanitization executed.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setIsDiagnosticsModalOpen(true)}
                      className="px-3 py-2 bg-red-950/80 hover:bg-red-900/90 text-red-200 border border-red-500/40 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Terminal className="w-3.5 h-3.5 text-red-300" />
                      <span>Inspect API Error Response</span>
                    </button>
                    {lastAttemptedPatterns.length > 0 && (
                      <button
                        onClick={handleRetryFailedSync}
                        disabled={isAutoPopulating}
                        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black transition-colors shrink-0 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isAutoPopulating ? 'animate-spin' : ''}`} />
                        <span>Retry Sync with Backoff</span>
                      </button>
                    )}
                  </div>
                </div>

                {populateErrorList.length > 0 && (
                  <div className="bg-slate-950/80 border border-red-500/20 rounded-lg p-3 font-mono text-[11px] text-red-300/90 space-y-1 max-h-36 overflow-y-auto">
                    <p className="font-bold text-[10px] uppercase text-red-400 tracking-wider mb-1">
                      Detailed API Error Diagnostics:
                    </p>
                    {populateErrorList.map((errItem, idx) => (
                      <p key={idx} className="leading-snug">• {errItem}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {urgentPatternsCount > 0 && (
              <div className="bg-gradient-to-r from-red-950/80 via-amber-950/40 to-slate-950 border border-red-500/40 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 bg-red-500/20 text-red-400 rounded-lg animate-pulse shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                  <div>
                    <strong className="text-red-300 font-extrabold">
                      {urgentPatternsCount} recurring payment{urgentPatternsCount > 1 ? 's' : ''} due within the next 48 hours!
                    </strong>
                    <span className="text-slate-300 ml-1.5">Action required for timely settlement.</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveCategoryFilter('URGENT_48H')}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-400 text-slate-950 font-extrabold rounded-lg transition-colors shrink-0 cursor-pointer"
                >
                  Filter Urgent (48h)
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredRecurringPatterns.map((pattern) => {
                const isSelected = selectedPatternIds.has(pattern.id);
                const nextDate = new Date(pattern.predictedNextDate);
                const dueStatus = getDueHoursStatus(pattern.predictedNextDate);
                const isUrgent = dueStatus.isDueWithin48h;

                return (
                  <div
                    key={pattern.id}
                    className={`border rounded-xl p-4 transition-all flex flex-col justify-between space-y-3 relative ${
                      isUrgent
                        ? 'bg-gradient-to-br from-red-950/50 via-slate-950 to-slate-950 border-red-500/80 ring-2 ring-red-500/30 shadow-xl shadow-red-500/10'
                        : isSelected
                        ? 'bg-slate-950/90 border-amber-500/40 shadow-lg shadow-amber-500/5'
                        : 'bg-slate-950/40 border-slate-800/80 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="space-y-2">
                      {isUrgent && (
                        <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-2.5 py-1 rounded-lg text-[10px] font-extrabold inline-flex items-center gap-1.5 font-mono animate-pulse w-fit">
                          <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                          <span>🚨 DUE WITHIN 48H ({dueStatus.label})</span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => togglePatternSelection(pattern.id)}
                            className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer border ${
                              isSelected
                                ? 'bg-amber-500 border-amber-500 text-slate-950'
                                : 'border-slate-700 hover:border-slate-500'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                              pattern.frequency === 'WEEKLY'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            }`}
                          >
                            {pattern.frequency}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                            pattern.confidence === 'HIGH'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {pattern.confidence} Confidence
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white tracking-tight leading-snug">
                        {pattern.title}
                      </h4>

                      <div className="flex items-baseline gap-1.5 font-mono">
                        <span className="text-sm font-extrabold text-amber-400">
                          {pattern.amount.toLocaleString()} {pattern.asset_symbol}
                        </span>
                        <span className="text-[10px] text-slate-400">avg / period</span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {pattern.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-900/80 flex items-center justify-between text-[10px] text-slate-400">
                      <div className={`flex items-center gap-1 font-mono ${isUrgent ? 'text-red-300 font-bold' : 'text-slate-300'}`}>
                        <Clock className={`w-3 h-3 ${isUrgent ? 'text-red-400 animate-spin' : 'text-amber-400'}`} />
                        <span>Predicted: {nextDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>

                      <button
                        onClick={() => handleSingleAutoPopulate(pattern)}
                        disabled={isAutoPopulating}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 text-[10px] font-bold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Schedule</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Events Control Bar & List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-white">Upcoming Calendar Events</h3>
                <span className="bg-slate-800 text-slate-300 text-xs font-mono px-2 py-0.5 rounded-full border border-slate-700">
                  {filteredEvents.length} {filteredEvents.length === 1 ? 'Event' : 'Events'}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Filter events..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-white px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-500 w-36 sm:w-48"
                />

                {/* Category Filters */}
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
                  <button
                    onClick={() => setActiveCategoryFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      activeCategoryFilter === 'ALL'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveCategoryFilter('FINANCIAL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      activeCategoryFilter === 'FINANCIAL'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Financial Only
                  </button>
                  <button
                    onClick={() => setActiveCategoryFilter('URGENT_48H')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1 ${
                      activeCategoryFilter === 'URGENT_48H'
                        ? 'bg-red-500/25 text-red-300 border border-red-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span>Due in 48h ({urgentPatternsCount})</span>
                  </button>
                </div>

                <button
                  onClick={() => accessToken && loadEvents(accessToken)}
                  disabled={isLoadingEvents}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                  title="Refresh Calendar Events"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingEvents ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              </div>
            </div>

            {/* Error state */}
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsDiagnosticsModalOpen(true)}
                    className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900/90 text-red-200 border border-red-500/40 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Terminal className="w-3.5 h-3.5 text-red-300" />
                    <span>Inspect Error Details</span>
                  </button>
                  <button
                    onClick={handleSignIn}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Re-Authenticate
                  </button>
                </div>
              </div>
            )}

            {/* Loading state */}
            {isLoadingEvents ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
                <p className="text-xs">Syncing with Google Calendar API...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3 bg-slate-950/40 rounded-xl border border-slate-800/60">
                <CalendarIcon className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No matching events found</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  There are no events scheduled in your primary Google Calendar matching this filter.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Schedule Entry</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEvents.map((ev) => {
                  const startStr = ev.start?.dateTime || ev.start?.date;
                  const endStr = ev.end?.dateTime || ev.end?.date;
                  const startDateObj = startStr ? new Date(startStr) : null;
                  const endDateObj = endStr ? new Date(endStr) : null;

                  return (
                    <div
                      key={ev.id}
                      className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-sm font-bold text-white tracking-tight leading-snug">
                            {ev.summary}
                          </h4>
                          {ev.htmlLink && (
                            <a
                              href={ev.htmlLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-amber-400 p-1 hover:bg-slate-800 rounded transition-colors shrink-0"
                              title="Open in Google Calendar"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        {ev.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {ev.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                        <div className="space-y-1">
                          {startDateObj && (
                            <div className="flex items-center gap-1.5 text-slate-300 font-mono">
                              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>
                                {startDateObj.toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric'
                                })}{' '}
                                •{' '}
                                {startDateObj.toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          )}

                          {ev.location && (
                            <div className="flex items-center gap-1.5 text-slate-400 font-mono truncate max-w-[200px]">
                              <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                              <span className="truncate">{ev.location}</span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons (Delete require user confirmation dialog) */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setDeletingEvent(ev)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete Event"
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
          </div>

          {/* Locally Cached Sync Attempts History View (IndexedDB) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div
              className="flex items-center justify-between cursor-pointer select-none pb-2 border-b border-slate-800/80"
              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            >
              <div className="flex items-center gap-3">
                <span className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                  <History className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white">
                      IndexedDB Sync Reconciliation History
                    </h3>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Database className="w-3 h-3 text-emerald-400" /> Offline Cache Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    History of locally cached sync attempts and Google Calendar reconciliation logs stored in IndexedDB.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  {syncHistoryLogs.length} Sync Attempt Logs
                </span>
                <button
                  type="button"
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 rounded-lg transition-colors"
                >
                  {isHistoryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isHistoryExpanded && (
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>
                      Last Successful REST API Reconciliation:{' '}
                      <strong className="text-emerald-400 font-mono">{lastSyncedTime || 'Not reconciled yet'}</strong>
                    </span>
                  </div>
                  <button
                    onClick={loadSyncHistory}
                    className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh IndexedDB History
                  </button>
                </div>

                {syncHistoryLogs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60 italic">
                    No sync attempts recorded in IndexedDB yet. Perform a calendar sync or subscription re-sync to generate local logs.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                    {syncHistoryLogs.map((log) => {
                      const isSuccess = log.status === 'SUCCESS';
                      const isOffline = log.status === 'CACHED_OFFLINE';
                      const isFailed = log.status === 'FAILED';

                      return (
                        <div
                          key={log.id}
                          className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                        >
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Status Badge */}
                              {isSuccess && (
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> SUCCESS
                                </span>
                              )}
                              {isOffline && (
                                <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <Zap className="w-3 h-3" /> CACHED OFFLINE
                                </span>
                              )}
                              {isFailed && (
                                <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> FAILED
                                </span>
                              )}
                              {log.status === 'PARTIAL' && (
                                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <RefreshCw className="w-3 h-3" /> PARTIAL
                                </span>
                              )}

                              {/* Source Badge */}
                              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/80 border border-indigo-800/60 px-2 py-0.5 rounded">
                                {log.source === 'SUBSCRIPTION_RE_SYNC' && 'Subscription Manager Re-Sync'}
                                {log.source === 'GOOGLE_API_FETCH' && 'Google REST API v3 Fetch'}
                                {log.source === 'RECURRING_POPULATE' && 'Batch Recurring Reminders'}
                                {log.source === 'OFFLINE_INDEXEDB' && 'IndexedDB Cache Recovery'}
                              </span>
                            </div>

                            <p className="text-xs text-slate-300 font-medium leading-relaxed">{log.details}</p>
                          </div>

                          <div className="sm:text-right shrink-0 border-t sm:border-t-0 border-slate-800/60 pt-2 sm:pt-0">
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {new Date(log.timestamp).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </span>
                            <span className="text-[11px] font-bold text-amber-400/90">
                              {log.eventsCount} Event(s) Reconciled
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Event Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                  <Plus className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-white">Create Google Calendar Entry</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Event Title / Summary <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MoMo Settlement Audit"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Start Date & Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    End Date & Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Location / Venue</label>
                <input
                  type="text"
                  placeholder="e.g. Kofi B2B Portal or Conference Room A"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Description / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Additional context or financial settlement terms..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Event</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mandatory Explicit Confirmation Modal for Destructive Delete Action */}
      {deletingEvent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Delete Google Calendar Event?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white">"{deletingEvent.summary}"</strong> from your primary Google Calendar?
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono">
              <p>Event ID: {deletingEvent.id}</p>
              {deletingEvent.start?.dateTime && (
                <p>Start: {new Date(deletingEvent.start.dateTime).toLocaleString()}</p>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingEvent(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteEvent}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Diagnostics & Error Response Body Modal */}
      {isDiagnosticsModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <Terminal className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-white">Google Calendar API Response & Diagnostics</h3>
                  <p className="text-xs text-slate-400">Inspect exact API response bodies, payload sanitization, and user timezone resolution.</p>
                </div>
              </div>
              <button
                onClick={() => setIsDiagnosticsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* System Timezone & Environment Settings Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Resolved Local Timezone</span>
                <span className="text-emerald-400 font-mono font-bold flex items-center gap-1.5 mt-0.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  {Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Target Calendar ID</span>
                <span className="text-amber-400 font-mono font-bold flex items-center gap-1.5 mt-0.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
                  primary (Google Calendar v3)
                </span>
              </div>
            </div>

            {/* Exact API Response Body / Failure Details */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-400" /> Exact API Response Body & Failure Log
                </h4>
                <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  Status: <strong className={syncStatus === 'ERROR' ? 'text-red-400' : 'text-emerald-400'}>{syncStatus}</strong>
                </span>
              </div>

              {populateErrorMsg || errorMsg || populateErrorList.length > 0 ? (
                <div className="space-y-3">
                  <div className="bg-slate-950 border border-red-500/30 rounded-xl p-4 font-mono text-xs text-red-300 space-y-2.5 shadow-inner">
                    <div className="flex items-center justify-between border-b border-red-500/20 pb-2 text-[10px] text-red-400 font-bold uppercase tracking-wider">
                      <span>HTTP REST API Error Detail</span>
                      <span>Target Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'}</span>
                    </div>

                    {populateErrorMsg && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-red-400 font-bold uppercase">Population Exception:</span>
                        <p className="text-xs text-red-200 font-mono leading-relaxed bg-red-950/40 p-2.5 rounded-lg border border-red-900/60 whitespace-pre-wrap">
                          {populateErrorMsg}
                        </p>
                      </div>
                    )}

                    {errorMsg && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-red-400 font-bold uppercase">API Fetch Exception:</span>
                        <p className="text-xs text-red-200 font-mono leading-relaxed bg-red-950/40 p-2.5 rounded-lg border border-red-900/60 whitespace-pre-wrap">
                          {errorMsg}
                        </p>
                      </div>
                    )}

                    {populateErrorList.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] text-amber-400 font-bold uppercase">Batch Item Error Messages ({populateErrorList.length}):</span>
                        <div className="space-y-1 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                          {populateErrorList.map((errItem, idx) => (
                            <pre key={idx} className="text-[11px] text-red-300 font-mono bg-slate-900 p-2 rounded border border-red-900/40 whitespace-pre-wrap">
                              {errItem}
                            </pre>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 text-xs text-emerald-400 flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <p className="font-bold text-emerald-300">No Active API Errors</p>
                    <p className="text-slate-400 mt-0.5 leading-relaxed">
                      All event payloads transmitted to Google Calendar REST API v3 have passed validation with explicit system timeZone <strong className="text-emerald-300 font-mono">{Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'}</strong> attached.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Event Payload Code Sample showing Explicit Local Timezone */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Validated Event Payload Standard with Local TimeZone:
              </span>
              <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300/90 overflow-x-auto whitespace-pre-wrap">
{JSON.stringify({
  summary: "🔄 Payment Reminder: MTN Fibre Internet & Office Broadband",
  description: "Subscription Manager Rule: MTN Ghana. Amount: 150 GHS. Execution Time: 09:00",
  start: {
    dateTime: new Date().toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  },
  end: {
    dateTime: new Date(Date.now() + 3600000).toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  },
  recurrence: ["RRULE:FREQ=MONTHLY;COUNT=12"]
}, null, 2)}
              </pre>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const diagText = `Google Calendar Sync Diagnostics:\nStatus: ${syncStatus}\nTimezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'}\nPopulate Error: ${populateErrorMsg || 'None'}\nFetch Error: ${errorMsg || 'None'}\nDetailed Errors: ${populateErrorList.join('; ') || 'None'}`;
                  navigator.clipboard.writeText(diagText);
                  if (onNotify) onNotify('Copied API error response diagnostics to clipboard', 'info');
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Response Body</span>
              </button>

              <div className="flex items-center gap-2">
                {accessToken && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDiagnosticsModalOpen(false);
                      loadEvents(accessToken);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-md"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Sync Now</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsDiagnosticsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
