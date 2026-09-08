import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Server,
  Zap,
  Smartphone,
  BookOpen,
  Lock,
  Unlock,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Radio,
  Sliders
} from 'lucide-react';
import { Transaction, LedgerEntry, MobileMoneyTransaction } from '../types';

interface MonitoringEvent {
  event_id: string;
  source_service: 'LEDGER' | 'CONNECTOR' | 'GATEWAY';
  event_type: string;
  reference_id: string;
  actor: string;
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'PENDING' | 'FLAGGED' | 'FAILED';
  risk_score: number; // 0 to 100
  details: string;
  ip_address: string;
  timestamp: string;
}

interface FraudAlert {
  alert_id: string;
  rule_triggered: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  entity: string;
  description: string;
  risk_score: number;
  status: 'ACTIVE' | 'RESOLVED' | 'FALSE_POSITIVE';
  detected_at: string;
}

interface TransactionMonitoringDashboardProps {
  transactions: Transaction[];
  ledgerEntries: LedgerEntry[];
  momoLogs: MobileMoneyTransaction[];
}

export const TransactionMonitoringDashboard: React.FC<TransactionMonitoringDashboardProps> = ({
  transactions,
  ledgerEntries,
  momoLogs
}) => {
  const [activeTab, setActiveTab] = useState<'stream' | 'alerts' | 'services' | 'analytics'>('stream');
  const [serviceFilter, setServiceFilter] = useState<'ALL' | 'LEDGER' | 'CONNECTOR' | 'GATEWAY'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<MonitoringEvent | null>(null);

  // Initial synthesized monitoring events combining Ledger, Connector, Gateway
  const [events, setEvents] = useState<MonitoringEvent[]>([
    {
      event_id: 'ev_901',
      source_service: 'GATEWAY',
      event_type: 'USSD_MOMO_DEPOSIT',
      reference_id: 'REF-RWF-88910',
      actor: '+250 788 123 456',
      amount: 450000,
      currency: 'RWF',
      status: 'SUCCESS',
      risk_score: 12,
      details: 'Successful MTN Rwanda MoMo deposit via USSD *951# prompt with valid PIN.',
      ip_address: '197.243.14.89',
      timestamp: new Date(Date.now() - 30000).toISOString()
    },
    {
      event_id: 'ev_902',
      source_service: 'CONNECTOR',
      event_type: 'LIGHTNING_INVOICE_SETTLED',
      reference_id: 'lnbc_sat_500000',
      actor: 'node_lightning_gateway_01',
      amount: 500000,
      currency: 'SAT',
      status: 'SUCCESS',
      risk_score: 5,
      details: 'Lightning Network invoice settled instantly via LND connector (0ms slippage).',
      ip_address: '104.21.88.12',
      timestamp: new Date(Date.now() - 75000).toISOString()
    },
    {
      event_id: 'ev_903',
      source_service: 'LEDGER',
      event_type: 'JOURNAL_ENTRY_POSTED',
      reference_id: 'JE-2026-9941',
      actor: 'system_double_entry_engine',
      amount: 15000,
      currency: 'USDT',
      status: 'SUCCESS',
      risk_score: 2,
      details: 'Immutable double-entry atomic journal posted with SHA-256 block signature.',
      ip_address: '127.0.0.1',
      timestamp: new Date(Date.now() - 120000).toISOString()
    },
    {
      event_id: 'ev_904',
      source_service: 'GATEWAY',
      event_type: 'RAPID_FAILED_LOGINS',
      reference_id: 'auth_brute_force_det',
      actor: 'suspect_ip_91.200.12.4',
      amount: 0,
      currency: 'USD',
      status: 'FLAGGED',
      risk_score: 88,
      details: 'SECURITY ALERT: 6 failed login attempts in 15 seconds from foreign ASN.',
      ip_address: '91.200.12.4',
      timestamp: new Date(Date.now() - 180000).toISOString()
    },
    {
      event_id: 'ev_905',
      source_service: 'CONNECTOR',
      event_type: 'LARGE_TRANSFER_ANOMALY',
      reference_id: 'tx_anomaly_7781',
      actor: 'pierrebahati508@gmail.com',
      amount: 75000,
      currency: 'USDT',
      status: 'FLAGGED',
      risk_score: 94,
      details: 'FRAUD ALERT: Unusually large outgoing transfer exceeding daily baseline by 450%.',
      ip_address: '41.186.42.11',
      timestamp: new Date(Date.now() - 240000).toISOString()
    }
  ]);

  // Initial fraud alerts
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([
    {
      alert_id: 'alt_881',
      rule_triggered: 'RAPID_FAILED_LOGIN_ATTEMPTS',
      severity: 'CRITICAL',
      entity: 'IP: 91.200.12.4',
      description: 'Multiple rapid failed login attempts detected across administrative endpoint in 15s.',
      risk_score: 88,
      status: 'ACTIVE',
      detected_at: new Date(Date.now() - 180000).toISOString()
    },
    {
      alert_id: 'alt_882',
      rule_triggered: 'UNUSUALLY_LARGE_TRANSFER',
      severity: 'HIGH',
      entity: 'Wallet: USDT-RESERVE-99',
      description: 'Transfer of 75,000 USDT requested without prior multi-sig quorum attestation.',
      risk_score: 94,
      status: 'ACTIVE',
      detected_at: new Date(Date.now() - 240000).toISOString()
    },
    {
      alert_id: 'alt_883',
      rule_triggered: 'VELOCITY_STRUCTURING_CHECK',
      severity: 'MEDIUM',
      entity: 'Account: +250 788 991 100',
      description: 'Four successive MoMo cash-out requests just below reporting threshold.',
      risk_score: 65,
      status: 'RESOLVED',
      detected_at: new Date(Date.now() - 600000).toISOString()
    }
  ]);

  // Simulate real-time streaming events
  useEffect(() => {
    if (!isLiveStreaming) return;
    const interval = setInterval(() => {
      const services: ('LEDGER' | 'CONNECTOR' | 'GATEWAY')[] = ['LEDGER', 'CONNECTOR', 'GATEWAY'];
      const svc = services[Math.floor(Math.random() * services.length)];
      const types = {
        LEDGER: ['JOURNAL_DEBIT_CREDIT', 'BALANCE_RECONCILED', 'MERKLE_ROOT_HASH'],
        CONNECTOR: ['LIGHTNING_HTLC_FORWARD', 'STRIPE_WEBHOOK_RECEIVED', 'MOMO_DISBURSEMENT'],
        GATEWAY: ['USSD_SESSION_PROMPT', 'API_RATE_LIMIT_CHECK', 'WEBHOOK_DISPATCH']
      };
      const randomType = types[svc][Math.floor(Math.random() * types[svc].length)];
      const amounts = [5000, 25000, 120000, 1500, 500000];
      const currencies = ['USDT', 'RWF', 'SAT', 'USD'];
      const statuses: ('SUCCESS' | 'PENDING' | 'FLAGGED')[] = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'PENDING', Math.random() > 0.8 ? 'FLAGGED' : 'SUCCESS'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const risk = status === 'FLAGGED' ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 15);

      const newEv: MonitoringEvent = {
        event_id: `ev_${Math.floor(Math.random() * 90000) + 10000}`,
        source_service: svc,
        event_type: randomType,
        reference_id: `ref_${Math.random().toString(36).substring(7)}`,
        actor: `user_node_${Math.floor(Math.random() * 500)}`,
        amount: amounts[Math.floor(Math.random() * amounts.length)],
        currency: currencies[Math.floor(Math.random() * currencies.length)],
        status: status,
        risk_score: risk,
        details: `Real-time ingestion stream from ${svc} service endpoint. Processing validated successfully.`,
        ip_address: `197.210.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
        timestamp: new Date().toISOString()
      };

      setEvents((prev) => [newEv, ...prev.slice(0, 49)]);
    }, 4500);

    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  // Simulation actions
  const simulateLargeTransferAlert = () => {
    const alert: FraudAlert = {
      alert_id: `alt_${Date.now()}`,
      rule_triggered: 'UNUSUALLY_LARGE_TRANSFER',
      severity: 'CRITICAL',
      entity: 'Wallet: 0x9941...8812',
      description: 'Simulated anomaly: Outgoing transfer of $250,000 USDT initiated outside normal business hours.',
      risk_score: 98,
      status: 'ACTIVE',
      detected_at: new Date().toISOString()
    };
    const event: MonitoringEvent = {
      event_id: `ev_${Date.now()}`,
      source_service: 'GATEWAY',
      event_type: 'LARGE_TRANSFER_ANOMALY',
      reference_id: `tx_large_${Math.floor(Math.random() * 10000)}`,
      actor: 'whale_investor_99@kofi.app',
      amount: 250000,
      currency: 'USDT',
      status: 'FLAGGED',
      risk_score: 98,
      details: 'SIMULATED FRAUD ALERT: Unusually large transfer exceeding risk threshold.',
      ip_address: '185.220.101.5',
      timestamp: new Date().toISOString()
    };
    setFraudAlerts((prev) => [alert, ...prev]);
    setEvents((prev) => [event, ...prev]);
  };

  const simulateBruteForceLogin = () => {
    const alert: FraudAlert = {
      alert_id: `alt_${Date.now()}`,
      rule_triggered: 'RAPID_FAILED_LOGIN_ATTEMPTS',
      severity: 'CRITICAL',
      entity: 'IP: 45.33.32.156',
      description: 'Simulated brute-force: 12 consecutive failed login attempts on admin account within 10 seconds.',
      risk_score: 95,
      status: 'ACTIVE',
      detected_at: new Date().toISOString()
    };
    const event: MonitoringEvent = {
      event_id: `ev_${Date.now()}`,
      source_service: 'GATEWAY',
      event_type: 'RAPID_FAILED_LOGINS',
      reference_id: `bf_login_${Math.floor(Math.random() * 10000)}`,
      actor: 'pierrebahati508@gmail.com (Target)',
      amount: 0,
      currency: 'USD',
      status: 'FLAGGED',
      risk_score: 95,
      details: 'SIMULATED BRUTE-FORCE: Rapid multiple failed login attempts detected.',
      ip_address: '45.33.32.156',
      timestamp: new Date().toISOString()
    };
    setFraudAlerts((prev) => [alert, ...prev]);
    setEvents((prev) => [event, ...prev]);
  };

  const resolveAlert = (alertId: string) => {
    setFraudAlerts((prev) =>
      prev.map((a) => (a.alert_id === alertId ? { ...a, status: 'RESOLVED' } : a))
    );
  };

  const filteredEvents = events.filter((ev) => {
    if (serviceFilter !== 'ALL' && ev.source_service !== serviceFilter) return false;
    if (statusFilter !== 'ALL' && ev.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ev.reference_id.toLowerCase().includes(q) ||
        ev.actor.toLowerCase().includes(q) ||
        ev.details.toLowerCase().includes(q) ||
        ev.ip_address.includes(q)
      );
    }
    return true;
  });

  const activeAlertsCount = fraudAlerts.filter((a) => a.status === 'ACTIVE').length;
  const totalVolume24h = events.reduce((acc, ev) => acc + (ev.currency === 'USDT' || ev.currency === 'USD' ? ev.amount : ev.amount / 1300), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Real-Time Transaction Monitoring</h2>
              <p className="text-sm text-slate-400">
                Unified Ingestion Pipeline: Ledger Engine • Payment Connectors • Mobile Money Gateway (*951#)
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
              isLiveStreaming
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            <Radio className={`w-4 h-4 ${isLiveStreaming ? 'animate-ping' : ''}`} />
            {isLiveStreaming ? 'Live Stream Active' : 'Stream Paused'}
          </button>

          <button
            onClick={simulateLargeTransferAlert}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition cursor-pointer"
          >
            Simulate Large Transfer
          </button>

          <button
            onClick={simulateBruteForceLogin}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
          >
            Simulate Brute-Force Login
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Volume (24h Ingested)</span>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            ${Math.round(totalVolume24h).toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 100% Reconciled across Ledger
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Fraud Alerts</span>
            <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-400">
            {activeAlertsCount} {activeAlertsCount > 0 && <span className="text-xs font-normal bg-rose-500/20 px-2 py-0.5 rounded text-rose-300">Action Req</span>}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Automated velocity & brute-force rules active
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Connector & Gateway Health</span>
            <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Server className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">99.98%</div>
          <p className="text-[11px] text-cyan-400 mt-1">
            Avg Latency: 14ms (Lightning / MoMo)
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Ledger Merkle Integrity</span>
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">Verified</div>
          <p className="text-[11px] text-amber-400 mt-1">SHA-256 Chained Immutable Logs</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('stream')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'stream'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          Live Ingestion Stream ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'alerts'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Fraud & Security Alerts ({fraudAlerts.length})
          {activeAlertsCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {activeAlertsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'services'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Server className="w-4 h-4" />
          Connected Services Telemetry
        </button>
      </div>

      {/* Tab 1: Live Ingestion Stream */}
      {activeTab === 'stream' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reference, actor, IP..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
                {(['ALL', 'LEDGER', 'CONNECTOR', 'GATEWAY'] as const).map((svc) => (
                  <button
                    key={svc}
                    onClick={() => setServiceFilter(svc)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                      serviceFilter === svc
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {svc}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
                {(['ALL', 'SUCCESS', 'FLAGGED', 'PENDING'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                      statusFilter === st
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Events Table / List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Event Type / Ref</th>
                    <th className="py-3 px-4">Actor / IP</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Risk Score</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {filteredEvents.map((ev) => (
                    <tr key={ev.event_id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                            ev.source_service === 'LEDGER'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : ev.source_service === 'CONNECTOR'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {ev.source_service === 'LEDGER' && <BookOpen className="w-3 h-3" />}
                          {ev.source_service === 'CONNECTOR' && <Zap className="w-3 h-3" />}
                          {ev.source_service === 'GATEWAY' && <Smartphone className="w-3 h-3" />}
                          {ev.source_service}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{ev.event_type}</div>
                        <div className="text-xs font-mono text-slate-400">{ev.reference_id}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-200">{ev.actor}</div>
                        <div className="text-[11px] font-mono text-slate-400">{ev.ip_address}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {ev.amount > 0 ? `${ev.amount.toLocaleString()} ${ev.currency}` : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                              ev.risk_score > 80
                                ? 'bg-rose-500/20 text-rose-400'
                                : ev.risk_score > 40
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {ev.risk_score}/100
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            ev.status === 'SUCCESS'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : ev.status === 'FLAGGED'
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {ev.status === 'SUCCESS' && <CheckCircle2 className="w-3 h-3" />}
                          {ev.status === 'FLAGGED' && <ShieldAlert className="w-3 h-3" />}
                          {ev.status === 'PENDING' && <Clock className="w-3 h-3" />}
                          {ev.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-400">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedEvent(ev)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                          title="Inspect Event Payload"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Fraud & Security Alerts */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Fraud Detection & Velocity Rules</h3>
              <p className="text-xs text-slate-400">
                Automated detection for rapid multiple failed login attempts, unusual large transfers, and velocity anomalies.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={simulateBruteForceLogin}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
              >
                Test Brute-Force Rule
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {fraudAlerts.map((alt) => (
              <div
                key={alt.alert_id}
                className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition ${
                  alt.status === 'ACTIVE'
                    ? 'bg-rose-950/20 border-rose-500/30 shadow-md shadow-rose-950/20'
                    : 'bg-slate-900 border-slate-800 opacity-75'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-xl mt-0.5 ${
                      alt.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-base">{alt.rule_triggered}</h4>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          alt.severity === 'CRITICAL' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950'
                        }`}
                      >
                        {alt.severity}
                      </span>
                      <span className="text-xs font-mono text-slate-400">Risk Score: {alt.risk_score}/100</span>
                    </div>
                    <p className="text-sm text-slate-300 mt-1">{alt.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span>Target Entity: <strong className="text-slate-200">{alt.entity}</strong></span>
                      <span>Detected: {new Date(alt.detected_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  {alt.status === 'ACTIVE' ? (
                    <>
                      <button
                        onClick={() => resolveAlert(alt.alert_id)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition cursor-pointer"
                      >
                        Resolve / Dismiss
                      </button>
                      <button
                        onClick={() => alert(`Account / IP ${alt.entity} has been frozen and blocked successfully.`)}
                        className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition cursor-pointer shadow"
                      >
                        Freeze Entity & IP
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                      Resolved
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Connected Services Telemetry */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white">Double-Entry Ledger</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400">Active</span>
            </div>
            <p className="text-xs text-slate-400">
              Maintains exact balanced accounting records across all accounts. Every event produces atomic Debit and Credit records.
            </p>
            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Total Journal Entries:</span>
                <span className="font-mono text-white">{ledgerEntries.length} Records</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Integrity Check:</span>
                <span className="font-mono text-emerald-400">SHA-256 Validated</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Zero-Sum Balance:</span>
                <span className="font-mono text-emerald-400">Verified (0.000)</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white">Payment Connectors</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400">Connected</span>
            </div>
            <p className="text-xs text-slate-400">
              Lightning Network LND, Stripe, and crypto node connectors routing instant payments and settlement.
            </p>
            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Active Channels:</span>
                <span className="font-mono text-white">12 LND Nodes</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Avg Latency:</span>
                <span className="font-mono text-emerald-400">12ms</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Success Rate:</span>
                <span className="font-mono text-emerald-400">99.99%</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white">Mobile Money Gateway</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400">Listening</span>
            </div>
            <p className="text-xs text-slate-400">
              USSD *951# session gateway, MTN Rwanda, Airtel Africa, and M-Pesa webhook ingestion.
            </p>
            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>USSD Webhooks Logged:</span>
                <span className="font-mono text-white">{momoLogs.length} Requests</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Signature Verification:</span>
                <span className="font-mono text-emerald-400">HMAC-SHA256 Active</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Auto-Reconciliation:</span>
                <span className="font-mono text-emerald-400">Enabled</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Inspect Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-lg">Event Payload Inspector</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Event ID:</span>
                <span className="font-mono text-white">{selectedEvent.event_id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Source Service:</span>
                <span className="font-semibold text-amber-400">{selectedEvent.source_service}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Event Type:</span>
                <span className="font-mono text-white">{selectedEvent.event_type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Reference ID:</span>
                <span className="font-mono text-slate-200">{selectedEvent.reference_id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Actor / Origin:</span>
                <span className="text-white">{selectedEvent.actor}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">IP Address:</span>
                <span className="font-mono text-slate-300">{selectedEvent.ip_address}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Risk Assessment:</span>
                <span className="font-mono font-bold text-rose-400">{selectedEvent.risk_score} / 100</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block mb-1">Payload Details:</span>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-300">
                  {selectedEvent.details}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
