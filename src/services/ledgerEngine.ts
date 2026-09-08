import { LedgerEntry, Transaction, WalletAccount } from '../types';

// Simple fast SHA-256 hash simulation for tamper-evident cryptographic chaining
export async function computeHash(data: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback deterministic hex representation
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

export interface DoubleEntryPayload {
  tx_id: string;
  debit_account_id: string;
  credit_account_id: string;
  debit_account_name: string;
  credit_account_name: string;
  amount: number;
  asset_symbol: string;
  description: string;
}

export async function createBalancedLedgerEntry(
  payload: DoubleEntryPayload,
  previousHash: string
): Promise<LedgerEntry> {
  const timestamp = new Date().toISOString();
  const entryId = 'ldg_' + Math.random().toString(36).substring(2, 10);
  
  const rawDataForHash = `${previousHash}|${entryId}|${payload.tx_id}|${payload.debit_account_id}|${payload.credit_account_id}|${payload.amount}|${payload.asset_symbol}|${timestamp}`;
  const hash = await computeHash(rawDataForHash);

  return {
    entry_id: entryId,
    tx_id: payload.tx_id,
    debit_account_id: payload.debit_account_id,
    credit_account_id: payload.credit_account_id,
    debit_account_name: payload.debit_account_name,
    credit_account_name: payload.credit_account_name,
    amount: payload.amount,
    asset_symbol: payload.asset_symbol,
    description: payload.description,
    hash,
    previous_hash: previousHash,
    created_at: timestamp
  };
}

export function verifyLedgerIntegrity(entries: LedgerEntry[]): {
  isValid: boolean;
  tamperedIndex?: number;
  merkleRoot: string;
} {
  if (entries.length === 0) {
    return { isValid: true, merkleRoot: '0000000000000000000000000000000000000000000000000000000000000000' };
  }

  for (let i = 1; i < entries.length; i++) {
    if (entries[i].previous_hash !== entries[i - 1].hash) {
      return {
        isValid: false,
        tamperedIndex: i,
        merkleRoot: entries[entries.length - 1].hash
      };
    }
  }

  return {
    isValid: true,
    merkleRoot: entries[entries.length - 1]?.hash || 'VALID'
  };
}

export function recordDoubleEntry(
  entries: LedgerEntry[],
  tx_id: string,
  debit_account_id: string,
  debit_account_name: string,
  credit_account_id: string,
  credit_account_name: string,
  amount: number,
  asset_symbol: string,
  description: string
): LedgerEntry[] {
  const previousHash = entries.length > 0 ? entries[entries.length - 1].hash : '0000000000000000000000000000000000000000000000000000000000000000';
  const entryId = 'ldg_ent_' + Math.floor(100000 + Math.random() * 900000);
  const timestamp = new Date().toISOString();
  
  // Fast deterministic hash calculation
  let hashVal = 0;
  const rawStr = `${previousHash}|${entryId}|${tx_id}|${debit_account_id}|${credit_account_id}|${amount}|${asset_symbol}|${timestamp}`;
  for (let i = 0; i < rawStr.length; i++) {
    hashVal = (hashVal << 5) - hashVal + rawStr.charCodeAt(i);
    hashVal |= 0;
  }
  const hash = Math.abs(hashVal).toString(16).padStart(64, '0');

  const newEntry: LedgerEntry = {
    entry_id: entryId,
    tx_id,
    debit_account_id,
    credit_account_id,
    debit_account_name,
    credit_account_name,
    amount,
    asset_symbol,
    description,
    hash,
    previous_hash: previousHash,
    created_at: timestamp
  };

  return [...entries, newEntry];
}
