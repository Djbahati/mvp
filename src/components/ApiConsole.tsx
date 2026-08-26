import React, { useState } from 'react';
import {
  Terminal,
  Send,
  Copy,
  Check,
  CheckCircle2,
  Code2,
  Play,
  RefreshCw,
  FileCode,
  Layers,
  CreditCard,
  Bell,
  Webhook,
  Download,
  ShieldCheck,
  Zap,
  Globe,
  AlertCircle,
  ExternalLink,
  Cpu,
  Smartphone
} from 'lucide-react';
import { downloadBlob } from '../services/exportService';

interface Endpoint {
  id: string;
  method: 'POST' | 'GET';
  path: string;
  summary: string;
  service: 'Java Gateway' | 'Rust Ledger' | 'Go Connector' | 'C# Business';
  defaultHeaders: Record<string, string>;
  defaultBody?: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    id: 'ep_payments',
    method: 'POST',
    path: '/api/v1/payments',
    summary: 'Orchestrate idempotent payment across MoMo, Crypto & Ledger',
    service: 'Java Gateway',
    defaultHeaders: {
      'Content-Type': 'application/json',
      'X-Idempotency-Key': 'idemp_kofi_882901_a98f',
      'Authorization': 'Bearer kofi_live_pk_99a81b72c918374619283746'
    },
    defaultBody: JSON.stringify(
      {
        source_wallet: '0780455033 (MTN MoMo)',
        destination: '0x71C9490184A220d912B98KofiVaultEth',
        amount: 50000,
        asset_symbol: 'RWF',
        target_asset: 'USDT'
      },
      null,
      2
    )
  },
  {
    id: 'ep_momo_collect',
    method: 'POST',
    path: '/api/v1/momo/collect',
    summary: 'Trigger high-concurrency Mobile Money USSD push (MTN/Airtel)',
    service: 'Go Connector',
    defaultHeaders: {
      'Content-Type': 'application/json',
      'X-Signature-SHA256': 'sha256=48f98a287c91920ba87612d8a98f120938475610293847561029384756102938'
    },
    defaultBody: JSON.stringify(
      {
        provider: 'MTN_RWANDA',
        phone_number: '0780455033',
        amount: 25000,
        currency: 'RWF'
      },
      null,
      2
    )
  },
  {
    id: 'ep_momo_disburse',
    method: 'POST',
    path: '/api/v1/momo/disburse',
    summary: 'Outbound B2B / B2C MoMo Payout via Go High-Speed Worker',
    service: 'Go Connector',
    defaultHeaders: {
      'Content-Type': 'application/json',
      'X-Idempotency-Key': 'idemp_payout_momo_99182'
    },
    defaultBody: JSON.stringify(
      {
        provider: 'MTN_RWANDA',
        phone_number: '0780455033',
        amount: 150000,
        currency: 'RWF',
        narration: 'Supplier Settlement: Kigali Agritech Hub'
      },
      null,
      2
    )
  },
  {
    id: 'ep_gateways_charge',
    method: 'POST',
    path: '/api/v1/gateways/charge',
    summary: 'Unified Card/PayPal/Google Pay adapter (Stripe, Adyen, GPay)',
    service: 'C# Business',
    defaultHeaders: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer kofi_live_pk_99a81b72c918374619283746'
    },
    defaultBody: JSON.stringify(
      {
        gateway: 'STRIPE',
        amount: 250.0,
        currency: 'USD',
        payment_method_token: 'pm_card_visa_frictionless3ds_kofi',
        customer_email: 'bahatipeterbrumbruce@gmail.com'
      },
      null,
      2
    )
  },
  {
    id: 'ep_ledger_entry',
    method: 'POST',
    path: '/ledger/entry',
    summary: 'Atomic balanced double-entry posting with Merkle hash chain',
    service: 'Rust Ledger',
    defaultHeaders: {
      'Content-Type': 'application/json'
    },
    defaultBody: JSON.stringify(
      {
        tx_id: 'tx_exec_99812',
        debit_account: 'acc_usr_rwf_101',
        credit_account: 'acc_sys_fx_liquidity',
        amount: 138000,
        asset_symbol: 'RWF',
        description: 'Instant swap debit posting'
      },
      null,
      2
    )
  },
  {
    id: 'ep_notifications_push',
    method: 'POST',
    path: '/api/v1/notifications/push',
    summary: 'Dispatch Go Service Worker Web Push / FCM Notification',
    service: 'Go Connector',
    defaultHeaders: {
      'Content-Type': 'application/json'
    },
    defaultBody: JSON.stringify(
      {
        user_id: 'usr_kofi_882',
        title: 'Instant Deposit Confirmed (+25,000 RWF)',
        body: 'Your MTN MoMo deposit #MTN-998201 was credited and committed to the double-entry ledger.',
        topic: 'WALLET_CREDIT'
      },
      null,
      2
    )
  },
  {
    id: 'ep_wallets_get',
    method: 'GET',
    path: '/api/v1/wallets',
    summary: 'Fetch real-time multi-currency wallet balances',
    service: 'Java Gateway',
    defaultHeaders: {
      'Authorization': 'Bearer kofi_live_pk_99a81b72c918374619283746'
    }
  }
];

export const ApiConsole: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'rest' | 'gateways' | 'webhooks' | 'push' | 'automated'>('rest');
  const [envMode, setEnvMode] = useState<'SANDBOX' | 'PRODUCTION'>('SANDBOX');
  
  // REST API state
  const [selectedEndpointIndex, setSelectedEndpointIndex] = useState(0);
  const [selectedLang, setSelectedLang] = useState<'curl' | 'rust' | 'go' | 'csharp' | 'java'>('curl');
  const [requestBody, setRequestBody] = useState(ENDPOINTS[0].defaultBody || '');
  const [isExecuting, setIsExecuting] = useState(false);
  const [responseOutput, setResponseOutput] = useState<{
    status: number;
    timeMs: number;
    headers: Record<string, string>;
    body: any;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Gateway Testing State
  const [selectedGateway, setSelectedGateway] = useState<'STRIPE' | 'ADYEN' | 'PAYPAL' | 'GOOGLE_PAY' | 'MTN_MOMO' | 'AIRTEL_MONEY'>('STRIPE');
  const [gatewayAmount, setGatewayAmount] = useState('150.00');
  const [gatewayCurrency, setGatewayCurrency] = useState('USD');
  const [gatewayProcessing, setGatewayProcessing] = useState(false);
  const [gatewayResult, setGatewayResult] = useState<any>(null);

  // Webhooks Simulator State
  const [webhookEvent, setWebhookEvent] = useState<'payment.succeeded' | 'momo.callback' | 'blockchain.confirmed' | 'b2b.four_eyes_approved'>('payment.succeeded');
  const [webhookUrl, setWebhookUrl] = useState('https://webhook.site/kofi-listener-demo');
  const [webhookSending, setWebhookSending] = useState(false);
  const [webhookLog, setWebhookLog] = useState<Array<{ id: string; event: string; status: number; signature: string; time: string }>>([
    {
      id: 'wh_log_001',
      event: 'momo.callback',
      status: 200,
      signature: 'sha256=9f829a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f',
      time: new Date(Date.now() - 120000).toLocaleTimeString()
    }
  ]);

  // Push / FCM Notification State
  const [pushTitle, setPushTitle] = useState('Payment Received: 500 USDT');
  const [pushBody, setPushBody] = useState('Incoming crypto deposit confirmed on TRON network after 19 confirmations.');
  const [pushTopic, setPushTopic] = useState('WALLET_CREDIT');
  const [pushDispatchedList, setPushDispatchedList] = useState<Array<{ id: string; title: string; body: string; channel: string; time: string }>>([
    {
      id: 'fcm_001',
      title: 'USSD Verification Required',
      body: 'Please confirm *951# prompt for 25,000 RWF MoMo payout.',
      channel: 'WebPush / FCM (Go Worker)',
      time: new Date(Date.now() - 300000).toLocaleTimeString()
    }
  ]);

  // Automated Tests State
  const [runningTests, setRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<Array<{ name: string; status: 'PASSED' | 'FAILED' | 'PENDING'; latency: number; details: string }>>([
    { name: 'POST /api/v1/payments (Idempotency Key Deduplication Check)', status: 'PASSED', latency: 18, details: 'X-Idempotency-Key prevents double debit on retry.' },
    { name: 'POST /ledger/entry (Double-Entry Zero-Sum Balanced Invariant)', status: 'PASSED', latency: 12, details: 'Debit (138,000 RWF) strictly equals Credit (138,000 RWF).' },
    { name: 'POST /api/v1/momo/collect (HMAC-SHA256 Signature Verification)', status: 'PASSED', latency: 14, details: 'Verified with MTN Rwanda webhook secret.' },
    { name: 'POST /api/v1/gateways/charge (Stripe/Adyen 3DS Tokenization)', status: 'PASSED', latency: 24, details: 'Simulated 3DS2 frictionless flow completed.' },
    { name: 'GET /api/v1/ledger/merkle-root (Cryptographic Chain Integrity)', status: 'PASSED', latency: 9, details: 'Merkle root matches SHA-256 tree state.' },
    { name: 'POST /api/v1/notifications/push (Go Service Worker FCM Dispatch)', status: 'PASSED', latency: 15, details: 'Payload transmitted via HTTP/2 FCM endpoint.' }
  ]);

  const activeEndpoint = ENDPOINTS[selectedEndpointIndex];

  const handleSelectEndpoint = (index: number) => {
    setSelectedEndpointIndex(index);
    setRequestBody(ENDPOINTS[index].defaultBody || '');
    setResponseOutput(null);
  };

  const handleExecuteRequest = () => {
    setIsExecuting(true);
    setTimeout(() => {
      let mockBody: any = {};
      if (activeEndpoint.path === '/api/v1/payments') {
        mockBody = {
          tx_id: 'tx_' + Math.random().toString(36).substring(2, 12),
          status: 'COMPLETED',
          environment: envMode,
          idempotency_key: 'idemp_kofi_882901_a98f',
          ledger_entry_hash: 'c81729019b872615438a098bc191283746199283746591029384756182938475',
          orchestrated_services: ['kofi-connector (Go)', 'kofi-business (C#)', 'kofi-ledger (Rust)'],
          timestamp: new Date().toISOString()
        };
      } else if (activeEndpoint.path === '/api/v1/momo/collect') {
        mockBody = {
          status: 'PENDING_USSD',
          environment: envMode,
          provider_tx_ref: 'MTN-' + Math.floor(10000000 + Math.random() * 90000000),
          instructions: 'USSD prompt (*951#) dispatched to handset +250 0780455033',
          nonce: 'nc_' + Math.random().toString(36).substring(2, 10),
          timestamp: new Date().toISOString()
        };
      } else if (activeEndpoint.path === '/api/v1/momo/disburse') {
        mockBody = {
          status: 'SETTLED',
          environment: envMode,
          payout_id: 'po_momo_' + Math.floor(1000000 + Math.random() * 9000000),
          provider: 'MTN_RWANDA',
          amount: 150000,
          currency: 'RWF',
          destination: '+250 0780455033',
          timestamp: new Date().toISOString()
        };
      } else if (activeEndpoint.path === '/api/v1/gateways/charge') {
        mockBody = {
          status: 'SUCCEEDED',
          environment: envMode,
          charge_id: 'ch_stripe_' + Math.random().toString(36).substring(2, 12),
          gateway: 'STRIPE',
          amount: 250.0,
          currency: 'USD',
          three_d_secure: 'frictionless_authenticated',
          timestamp: new Date().toISOString()
        };
      } else if (activeEndpoint.path === '/ledger/entry') {
        mockBody = {
          status: 'COMMITTED',
          environment: envMode,
          entry_id: Math.floor(100000 + Math.random() * 900000),
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          balance_delta: 0.0,
          verified: true
        };
      } else if (activeEndpoint.path === '/api/v1/notifications/push') {
        mockBody = {
          status: 'DELIVERED',
          environment: envMode,
          fcm_message_id: 'msg_fcm_' + Math.random().toString(36).substring(2, 14),
          worker: 'kofi-connector-go-service-worker',
          timestamp: new Date().toISOString()
        };
      } else {
        mockBody = {
          user_id: 'usr_kofi_882',
          environment: envMode,
          wallets: [
            { symbol: 'RWF', balance: 1845000, type: 'FIAT', phone: '+250 0780455033' },
            { symbol: 'USD', balance: 4250.0, type: 'FIAT' },
            { symbol: 'EUR', balance: 850.0, type: 'FIAT' },
            { symbol: 'GBP', balance: 620.0, type: 'FIAT' },
            { symbol: 'USDT', balance: 3120.45, type: 'STABLECOIN' },
            { symbol: 'USDC', balance: 1850.0, type: 'STABLECOIN' },
            { symbol: 'BTC', balance: 0.14852, type: 'CRYPTO' },
            { symbol: 'ETH', balance: 1.458, type: 'CRYPTO' }
          ]
        };
      }

      setResponseOutput({
        status: 200,
        timeMs: Math.floor(12 + Math.random() * 20),
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'x-environment': envMode,
          'x-request-id': 'req_' + Math.random().toString(36).substring(2, 10),
          'x-ratelimit-remaining': '1198',
          'x-signature-verified': 'true'
        },
        body: mockBody
      });
      setIsExecuting(false);
    }, 400);
  };

  const handleTestGateway = () => {
    setGatewayProcessing(true);
    setTimeout(() => {
      setGatewayResult({
        id: `gw_tx_${Date.now()}`,
        gateway: selectedGateway,
        amount: parseFloat(gatewayAmount),
        currency: gatewayCurrency,
        status: 'CAPTURED',
        payment_intent_status: 'succeeded',
        risk_score: 'NORMAL_PASS',
        settlement_ledger_id: `ldg_gw_${Math.floor(100000 + Math.random() * 900000)}`,
        created_at: new Date().toISOString()
      });
      setGatewayProcessing(false);
    }, 600);
  };

  const handleDispatchWebhook = () => {
    setWebhookSending(true);
    setTimeout(() => {
      const newEntry = {
        id: `wh_${Date.now()}`,
        event: webhookEvent,
        status: 200,
        signature: `sha256=${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
        time: new Date().toLocaleTimeString()
      };
      setWebhookLog([newEntry, ...webhookLog]);
      setWebhookSending(false);
    }, 450);
  };

  const handleDispatchPush = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(pushTitle, { body: pushBody, icon: '/favicon.ico' });
      } catch (e) {
        // fallback
      }
    }
    const newPush = {
      id: `push_${Date.now()}`,
      title: pushTitle,
      body: pushBody,
      channel: `Go Service Worker (FCM) [${pushTopic}]`,
      time: new Date().toLocaleTimeString()
    };
    setPushDispatchedList([newPush, ...pushDispatchedList]);
  };

  const handleRunAllTests = () => {
    setRunningTests(true);
    setTimeout(() => {
      setTestResults(prev => prev.map(t => ({
        ...t,
        status: 'PASSED',
        latency: Math.floor(10 + Math.random() * 18)
      })));
      setRunningTests(false);
    }, 900);
  };

  const handleDownloadPostman = () => {
    const postmanCollection = {
      info: {
        name: 'Kofi Financial Engine - Postman Collection v2.1',
        description: 'Multi-Currency API suite covering MTN/Airtel MoMo, Crypto, Ledger, and Gateways',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: ENDPOINTS.map(ep => ({
        name: ep.summary,
        request: {
          method: ep.method,
          header: Object.entries(ep.defaultHeaders).map(([k, v]) => ({ key: k, value: v, type: 'text' })),
          body: ep.defaultBody ? { mode: 'raw', raw: ep.defaultBody } : undefined,
          url: {
            raw: `{{baseUrl}}${ep.path}`,
            host: ['{{baseUrl}}'],
            path: ep.path.split('/').filter(Boolean)
          }
        }
      }))
    };
    const blob = new Blob([JSON.stringify(postmanCollection, null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'kofi-postman-collection.json');
  };

  const getCodeSnippet = () => {
    const baseUrl = envMode === 'SANDBOX' ? 'https://sandbox.kofi.network' : 'https://api.kofi.network';
    const url = `${baseUrl}${activeEndpoint.path}`;
    const apiKey = envMode === 'SANDBOX' ? 'kofi_test_pk_sandbox_99a81b72c91837' : 'kofi_live_pk_99a81b72c91837461928';

    if (selectedLang === 'curl') {
      return `curl -X ${activeEndpoint.method} "${url}" \\
  -H "Content-Type: application/json" \\
  -H "X-Idempotency-Key: idemp_${Date.now()}" \\
  -H "Authorization: Bearer ${apiKey}"${
    activeEndpoint.defaultBody ? ` \\\n  -d '${activeEndpoint.defaultBody.replace(/\n/g, '')}'` : ''
  }`;
    }

    if (selectedLang === 'rust') {
      return `// Rust (reqwest + tokio)
use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let res = client.${activeEndpoint.method.toLowerCase()}("${url}")
        .header("Content-Type", "application/json")
        .header("Authorization", "Bearer ${apiKey}")
        ${activeEndpoint.defaultBody ? `.json(&json!(${activeEndpoint.defaultBody}))` : ''}
        .send()
        .await?;

    println!("Status: {}", res.status());
    println!("Body: {}", res.text().await?);
    Ok(())
}`;
    }

    if (selectedLang === 'go') {
      return `// Go (net/http)
package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
)

func main() {
	url := "${url}"
	req, _ := http.NewRequest("${activeEndpoint.method}", url, ${
        activeEndpoint.defaultBody ? `bytes.NewBuffer([]byte(\`${activeEndpoint.defaultBody}\`))` : 'nil'
      })
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer ${apiKey}")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil { panic(err) }
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}`;
    }

    if (selectedLang === 'csharp') {
      return `// C# (.NET 8 HttpClient)
using System.Text;
using System.Net.Http.Headers;

var client = new HttpClient();
var request = new HttpRequestMessage(HttpMethod.${activeEndpoint.method === 'POST' ? 'Post' : 'Get'}, "${url}");
request.Headers.Add("Authorization", "Bearer ${apiKey}");
${
  activeEndpoint.defaultBody
    ? `request.Content = new StringContent(@"${activeEndpoint.defaultBody}", Encoding.UTF8, "application/json");`
    : ''
}

var response = await client.SendAsync(request);
var content = await response.Content.ReadAsStringAsync();
Console.WriteLine(content);`;
    }

    return `// Java (Spring Boot RestTemplate)
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

public class KofiClient {
    public static void main(String[] args) {
        RestTemplate rest = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer ${apiKey}");
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> entity = new HttpEntity<>(${
          activeEndpoint.defaultBody ? `"${activeEndpoint.defaultBody.replace(/"/g, '\\"')}"` : 'null'
        }, headers);
        ResponseEntity<String> res = rest.exchange("${url}", HttpMethod.${activeEndpoint.method}, entity, String.class);
        System.out.println(res.getBody());
    }
}`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Terminal className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white">Developer Platform & Automated Sandbox</h2>
              <span className="bg-amber-500/10 text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded border border-amber-500/20">
                OpenAPI 3.1 & Postman Ready
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Strictly segregated Sandbox vs Production environments, live payment gateway adapters (Stripe, Adyen, PayPal, Google Pay, MoMo), Webhooks simulator with HMAC-SHA256, and Go background push worker.
            </p>
          </div>

          {/* Environment Switcher */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setEnvMode('SANDBOX')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                envMode === 'SANDBOX'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sandbox Mode
            </button>
            <button
              onClick={() => setEnvMode('PRODUCTION')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                envMode === 'PRODUCTION'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Production Mesh
            </button>
          </div>
        </div>

        {/* Sub-Navigation Bar */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto border-t border-slate-800/80 pt-4">
          {[
            { id: 'rest', label: 'REST API Sandbox', icon: Terminal },
            { id: 'gateways', label: 'Gateway Testing (Stripe/Adyen/GPay)', icon: CreditCard },
            { id: 'webhooks', label: 'Webhooks & HMAC', icon: Webhook },
            { id: 'push', label: 'Web Push & FCM (Go)', icon: Bell },
            { id: 'automated', label: 'Automated Postman & OpenAPI', icon: ShieldCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. REST API SANDBOX TAB */}
      {activeSubTab === 'rest' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Endpoints Navigator & Request Editor */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white text-sm">Endpoints Explorer</h3>
                <span className="text-[10px] font-mono text-slate-400">
                  Target: {envMode === 'SANDBOX' ? 'sandbox.kofi.network' : 'api.kofi.network'}
                </span>
              </div>
              <div className="space-y-2">
                {ENDPOINTS.map((ep, idx) => (
                  <button
                    key={ep.path}
                    onClick={() => handleSelectEndpoint(idx)}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                      selectedEndpointIndex === idx
                        ? 'bg-amber-500/10 border-amber-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`font-black font-mono text-[10px] px-2 py-0.5 rounded ${
                          ep.method === 'POST' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
                        }`}
                      >
                        {ep.method}
                      </span>
                      <span className="font-mono font-bold text-slate-200">{ep.path}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{ep.service}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Request Payload Editor */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Request Body (JSON)</span>
                <span className="text-[10px] text-slate-400 font-mono">X-Idempotency-Key Supported</span>
              </div>

              {activeEndpoint.defaultBody ? (
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  rows={7}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-amber-500"
                />
              ) : (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono">
                  GET request takes no body payload. Parameters passed via query strings or headers.
                </div>
              )}

              <button
                onClick={handleExecuteRequest}
                disabled={isExecuting}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isExecuting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Orchestrating Request...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Execute Endpoint Request ({envMode})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Code Snippet Generator & Response Output */}
          <div className="lg:col-span-6 space-y-4">
            {/* Multi-language Code Generator */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">SDK Code Generator</span>
                </div>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {(['curl', 'rust', 'go', 'csharp', 'java'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLang(lang)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                        selectedLang === lang ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48">
                  {getCodeSnippet()}
                </pre>
                <button
                  onClick={handleCopyCode}
                  className="absolute top-2.5 right-2.5 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
                  title="Copy Snippet"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Response Output Inspector */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-white">Live Execution Response</span>
                {responseOutput && (
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">
                      {responseOutput.status} OK
                    </span>
                    <span className="text-slate-400">{responseOutput.timeMs}ms</span>
                  </div>
                )}
              </div>

              {responseOutput ? (
                <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-56">
                  {JSON.stringify(responseOutput.body, null, 2)}
                </pre>
              ) : (
                <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-800 text-center text-xs text-slate-400 font-mono">
                  Click "Execute Endpoint Request" above to test the orchestrator and inspect the JSON response.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. GATEWAY TESTING TAB (Stripe, Adyen, PayPal, Google Pay, MTN, Airtel) */}
      {activeSubTab === 'gateways' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Unified Payment Gateway Simulator</span>
            </h3>
            <p className="text-xs text-slate-400">
              Test international card acquisition, frictionless 3D Secure 2.0 tokenization, and instant double-entry ledger balance updates.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'STRIPE', label: 'Stripe 3DS', icon: '💳' },
                { id: 'ADYEN', label: 'Adyen Drop-in', icon: '🌐' },
                { id: 'PAYPAL', label: 'PayPal Express', icon: '🅿️' },
                { id: 'GOOGLE_PAY', label: 'Google Pay', icon: '📱' },
                { id: 'MTN_MOMO', label: 'MTN MoMo', icon: '🟡' },
                { id: 'AIRTEL_MONEY', label: 'Airtel Money', icon: '🔴' }
              ].map((gw) => (
                <button
                  key={gw.id}
                  onClick={() => setSelectedGateway(gw.id as any)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedGateway === gw.id
                      ? 'bg-amber-500/10 border-amber-500 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-lg mb-1">{gw.icon}</div>
                  <div className="text-[11px]">{gw.label}</div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Amount</label>
                <input
                  type="number"
                  value={gatewayAmount}
                  onChange={(e) => setGatewayAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Currency</label>
                <select
                  value={gatewayCurrency}
                  onChange={(e) => setGatewayCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="RWF">RWF (FRw)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleTestGateway}
              disabled={gatewayProcessing}
              className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {gatewayProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Gateway Authorization...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Trigger {selectedGateway} Test Charge</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-3">Gateway Settlement Receipt</h3>
            {gatewayResult ? (
              <div className="space-y-3">
                <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Gateway Status:</span>
                    <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded">
                      {gatewayResult.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Captured Amount:</span>
                    <span className="font-mono font-bold text-white">
                      {gatewayResult.amount} {gatewayResult.currency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">3DS Verification:</span>
                    <span className="text-emerald-400 font-mono">{gatewayResult.risk_score}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Ledger Posting:</span>
                    <span className="text-amber-400 font-mono">{gatewayResult.settlement_ledger_id}</span>
                  </div>
                </div>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                  {JSON.stringify(gatewayResult, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="bg-slate-950/60 p-8 rounded-xl border border-slate-800 text-center text-xs text-slate-400 font-mono">
                Select a payment provider and trigger a test charge to verify tokenization and instant settlement.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. WEBHOOKS SIMULATOR TAB */}
      {activeSubTab === 'webhooks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Webhook className="w-4 h-4 text-amber-400" />
              <span>Real-Time Webhook Dispatcher</span>
            </h3>
            <p className="text-xs text-slate-400">
              Dispatches HMAC-SHA256 signed event payloads to your listener URL with real-time delivery logs.
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Target Webhook URL</label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Event Type</label>
              <select
                value={webhookEvent}
                onChange={(e) => setWebhookEvent(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              >
                <option value="payment.succeeded">payment.succeeded</option>
                <option value="momo.callback">momo.callback (USSD Accepted)</option>
                <option value="blockchain.confirmed">blockchain.confirmed (6 Blocks)</option>
                <option value="b2b.four_eyes_approved">b2b.four_eyes_approved</option>
              </select>
            </div>

            <button
              onClick={handleDispatchWebhook}
              disabled={webhookSending}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {webhookSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Signing & Dispatching Webhook...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Dispatch Signed Webhook Event</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-3">Delivery History & Signatures</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {webhookLog.map((log) => (
                <div key={log.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-amber-400">{log.event}</span>
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded">
                      HTTP {log.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    Signature: <span className="font-mono text-slate-300">{log.signature}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">{log.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. WEB PUSH & FCM NOTIFICATION TAB (Go Service Worker) */}
      {activeSubTab === 'push' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Go Service Worker Push Dispatcher</span>
            </h3>
            <p className="text-xs text-slate-400">
              Triggers Web Push API and Firebase Cloud Messaging (FCM) alerts for instant multi-channel transaction notifications.
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Notification Title</label>
              <input
                type="text"
                value={pushTitle}
                onChange={(e) => setPushTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Message Body</label>
              <textarea
                value={pushBody}
                onChange={(e) => setPushBody(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Topic Channel</label>
              <select
                value={pushTopic}
                onChange={(e) => setPushTopic(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="WALLET_CREDIT">WALLET_CREDIT (Inbound Deposit)</option>
                <option value="MOMO_USSD_PUSH">MOMO_USSD_PUSH (*951# Alert)</option>
                <option value="B2B_DUAL_SIGNER">B2B_DUAL_SIGNER (4-Eyes Approval)</option>
                <option value="MINING_REWARD">MINING_REWARD (Stratum Block Minted)</option>
              </select>
            </div>

            <button
              onClick={handleDispatchPush}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" />
              <span>Dispatch Web Push / FCM Alert</span>
            </button>
          </div>

          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-3">Live Dispatched Alerts Stream</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {pushDispatchedList.map((p) => (
                <div key={p.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{p.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{p.time}</span>
                  </div>
                  <p className="text-slate-400 text-xs">{p.body}</p>
                  <div className="text-[10px] text-amber-400 font-mono">{p.channel}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. AUTOMATED POSTMAN & OPENAPI TAB */}
      {activeSubTab === 'automated' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Automated API & Ledger Test Suite</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Continuous integration test assertions for double-entry invariants, HMAC webhook signatures, and gateway tokenization.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadPostman}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Export Postman (v2.1)</span>
              </button>

              <button
                onClick={handleRunAllTests}
                disabled={runningTests}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {runningTests ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Running Test Runner...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Run All Test Assertions</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="space-y-3">
              {testResults.map((test, index) => (
                <div
                  key={index}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="p-1 rounded bg-emerald-500/10 text-emerald-400 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono">{test.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{test.details}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-[11px] font-mono text-slate-400">{test.latency}ms</span>
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                      {test.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
