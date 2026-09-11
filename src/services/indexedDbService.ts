import { Transaction } from '../types';
import { CalendarEvent } from './calendarService';
import { RecurringPaymentPattern } from './recurringPaymentService';

const DB_NAME = 'KofiWalletDB';
const DB_VERSION = 2;

export interface SyncHealthMeta {
  status: 'SYNCED' | 'RETRYING' | 'ERROR' | 'OFFLINE';
  lastSyncedAt: string | null;
  errorMessage?: string | null;
  cachedEventsCount: number;
  cachedTxCount: number;
}

export interface SyncHistoryLogItem {
  id: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'CACHED_OFFLINE' | 'PARTIAL';
  source: 'GOOGLE_API_FETCH' | 'SUBSCRIPTION_RE_SYNC' | 'RECURRING_POPULATE' | 'OFFLINE_INDEXEDB';
  eventsCount: number;
  details: string;
}

let dbInstance: IDBDatabase | null = null;

export async function initIndexedDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('transactions')) {
        db.createObjectStore('transactions', { keyPath: 'tx_id' });
      }

      if (!db.objectStoreNames.contains('calendar_events')) {
        const store = db.createObjectStore('calendar_events', { keyPath: 'id' });
        store.createIndex('by_start', 'start.dateTime', { unique: false });
      }

      if (!db.objectStoreNames.contains('recurring_patterns')) {
        db.createObjectStore('recurring_patterns', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('sync_meta')) {
        db.createObjectStore('sync_meta', { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains('sync_history')) {
        const historyStore = db.createObjectStore('sync_history', { keyPath: 'id' });
        historyStore.createIndex('by_timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      console.log('[IndexedDB] KofiWalletDB initialized successfully.');
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      const err = (event.target as IDBOpenDBRequest).error;
      console.error('[IndexedDB] Initialization failed:', err);
      reject(err);
    };
  });
}

/**
 * Save transaction history to local IndexedDB
 */
export async function saveTransactionsToIDB(transactions: Transaction[]): Promise<void> {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');

    for (const item of transactions) {
      if (item.tx_id) {
        store.put(item);
      }
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        console.log(`[IndexedDB] Saved ${transactions.length} transactions to local offline cache.`);
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Failed to save transactions:', err);
  }
}

/**
 * Retrieve transaction history from local IndexedDB
 */
export async function getTransactionsFromIDB(): Promise<Transaction[]> {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction('transactions', 'readonly');
    const store = tx.objectStore('transactions');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Failed to read transactions:', err);
    return [];
  }
}

/**
 * Save Google Calendar events to local IndexedDB
 */
export async function saveCalendarEventsToIDB(events: CalendarEvent[]): Promise<void> {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction('calendar_events', 'readwrite');
    const store = tx.objectStore('calendar_events');

    for (const evt of events) {
      const id = evt.id || `local_evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      store.put({ ...evt, id });
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        console.log(`[IndexedDB] Saved ${events.length} calendar events to local offline cache.`);
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Failed to save calendar events:', err);
  }
}

/**
 * Retrieve Google Calendar events from local IndexedDB
 */
export async function getCalendarEventsFromIDB(): Promise<CalendarEvent[]> {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction('calendar_events', 'readonly');
    const store = tx.objectStore('calendar_events');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Failed to read calendar events:', err);
    return [];
  }
}

/**
 * Save recurring payment patterns to local IndexedDB
 */
export async function saveRecurringPatternsToIDB(patterns: RecurringPaymentPattern[]): Promise<void> {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction('recurring_patterns', 'readwrite');
    const store = tx.objectStore('recurring_patterns');

    for (const item of patterns) {
      store.put(item);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        console.log(`[IndexedDB] Saved ${patterns.length} recurring payment patterns.`);
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Failed to save recurring patterns:', err);
  }
}

/**
 * Retrieve recurring payment patterns from local IndexedDB
 */
export async function getRecurringPatternsFromIDB(): Promise<RecurringPaymentPattern[]> {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction('recurring_patterns', 'readonly');
    const store = tx.objectStore('recurring_patterns');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Failed to read recurring patterns:', err);
    return [];
  }
}

/**
 * Save sync health metadata to IndexedDB
 */
export async function saveSyncHealthMeta(meta: SyncHealthMeta): Promise<void> {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction('sync_meta', 'readwrite');
    const store = tx.objectStore('sync_meta');
    store.put({ key: 'calendar_sync_status', ...meta });
  } catch (err) {
    console.warn('[IndexedDB] Failed to save sync health meta:', err);
  }
}

/**
 * Retrieve sync health metadata from IndexedDB
 */
export async function getSyncHealthMeta(): Promise<SyncHealthMeta | null> {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction('sync_meta', 'readonly');
    const store = tx.objectStore('sync_meta');
    const request = store.get('calendar_sync_status');

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

/**
 * Record a sync attempt log entry into IndexedDB
 */
export async function recordSyncHistoryLog(log: Omit<SyncHistoryLogItem, 'id'>): Promise<SyncHistoryLogItem | null> {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction('sync_history', 'readwrite');
    const store = tx.objectStore('sync_history');

    const item: SyncHistoryLogItem = {
      ...log,
      id: `sync_log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };

    store.put(item);

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(item);
      tx.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('[IndexedDB] Failed to record sync history log:', err);
    return null;
  }
}

/**
 * Retrieve all recorded sync attempt logs from IndexedDB
 */
export async function getSyncHistoryLogs(): Promise<SyncHistoryLogItem[]> {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction('sync_history', 'readonly');
    const store = tx.objectStore('sync_history');
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const results: SyncHistoryLogItem[] = request.result || [];
        // Sort descending by timestamp
        results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(results);
      };
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('[IndexedDB] Failed to fetch sync history logs:', err);
    return [];
  }
}
