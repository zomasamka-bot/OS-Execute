"use client";

/**
 * OS Execute — Unified State Store
 * Handles localStorage persistence + BroadcastChannel cross-tab synchronization.
 * All state mutations go through this module to ensure consistency.
 */

import type { PaymentRecord } from "@/lib/payment-types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export const STORE_KEY_RECORDS = "os_execute_records_v1";
export const STORE_KEY_WALLET = "os_execute_wallet_session_v1";
export const BROADCAST_CHANNEL_NAME = "os_execute_sync";

// ---------------------------------------------------------------------------
// Broadcast message types
// ---------------------------------------------------------------------------
export type SyncMessage =
  | { type: "RECORDS_UPDATED"; records: PaymentRecord[] }
  | { type: "WALLET_CONNECTED"; session: WalletSession }
  | { type: "WALLET_DISCONNECTED" };

export interface WalletSession {
  username: string;
  uid: string;
  walletAddress: string;
  connectedAt: string;
}

// ---------------------------------------------------------------------------
// localStorage helpers with error recovery
// ---------------------------------------------------------------------------
function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[OS Execute Store] Failed to read ${key}:`, err);
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    if (err instanceof Error && err.name === "QuotaExceededError") {
      console.warn(`[OS Execute Store] localStorage quota exceeded`);
    } else {
      console.warn(`[OS Execute Store] Failed to write ${key}:`, err);
    }
  }
}

function safeDelete(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Payment Records
// ---------------------------------------------------------------------------
export function loadRecords(): PaymentRecord[] {
  return safeRead<PaymentRecord[]>(STORE_KEY_RECORDS, []);
}

export function saveRecords(records: PaymentRecord[]): void {
  safeWrite(STORE_KEY_RECORDS, records);
}

export function addRecord(record: PaymentRecord): PaymentRecord[] {
  const current = loadRecords();
  const updated = [record, ...current];
  saveRecords(updated);
  console.log(`[OS Execute Store] Record added:`, record.referenceId);
  broadcast({ type: "RECORDS_UPDATED", records: updated });
  return updated;
}

export function updateRecord(referenceId: string, patch: Partial<PaymentRecord>): PaymentRecord[] {
  const current = loadRecords();
  const updated = current.map((r) =>
    r.referenceId === referenceId ? { ...r, ...patch } : r
  );
  saveRecords(updated);
  console.log(`[OS Execute Store] Record updated:`, referenceId, patch);
  broadcast({ type: "RECORDS_UPDATED", records: updated });
  return updated;
}

// ---------------------------------------------------------------------------
// Wallet Session
// ---------------------------------------------------------------------------
export function loadWalletSession(): WalletSession | null {
  return safeRead<WalletSession | null>(STORE_KEY_WALLET, null);
}

export function saveWalletSession(session: WalletSession): void {
  safeWrite(STORE_KEY_WALLET, session);
  console.log(`[OS Execute Store] Wallet session saved:`, session.username);
  broadcast({ type: "WALLET_CONNECTED", session });
}

export function clearWalletSession(): void {
  safeDelete(STORE_KEY_WALLET);
  console.log(`[OS Execute Store] Wallet session cleared`);
  broadcast({ type: "WALLET_DISCONNECTED" });
}

// ---------------------------------------------------------------------------
// BroadcastChannel cross-tab sync with error recovery
// ---------------------------------------------------------------------------
let _channel: BroadcastChannel | null = null;
const _listeners: Array<(msg: SyncMessage) => void> = [];

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (!("BroadcastChannel" in window)) {
    console.debug("[OS Execute Store] BroadcastChannel not supported in this environment");
    return null;
  }

  if (!_channel) {
    try {
      _channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      _channel.onmessage = (event: MessageEvent<SyncMessage>) => {
        console.debug(`[OS Execute Store] Broadcast message received:`, event.data.type);
        for (const fn of _listeners) {
          try {
            fn(event.data);
          } catch (err) {
            console.error(`[OS Execute Store] Listener error:`, err);
          }
        }
      };
      _channel.onerror = (event: Event) => {
        console.error(`[OS Execute Store] BroadcastChannel error:`, event);
      };
      console.log(`[OS Execute Store] BroadcastChannel initialized`);
    } catch (err) {
      console.warn(`[OS Execute Store] Failed to initialize BroadcastChannel:`, err);
      _channel = null;
    }
  }

  return _channel;
}

export function broadcast(msg: SyncMessage): void {
  try {
    const ch = getChannel();
    if (ch) {
      ch.postMessage(msg);
      console.debug(`[OS Execute Store] Broadcast sent:`, msg.type);
    }
  } catch (err) {
    console.error(`[OS Execute Store] Broadcast error:`, err);
  }
}

export function subscribeSyncMessages(fn: (msg: SyncMessage) => void): () => void {
  _listeners.push(fn);
  // Ensure channel is initialized
  getChannel();
  return () => {
    const idx = _listeners.indexOf(fn);
    if (idx !== -1) _listeners.splice(idx, 1);
  };
}

// ---------------------------------------------------------------------------
// Environment detection
// ---------------------------------------------------------------------------
export function detectEnvironment(): "pi-browser" | "testnet" | "preview" {
  if (typeof window === "undefined") return "preview";

  const ua = navigator.userAgent || "";

  // Check for Pi Browser user agent
  if (/PiBrowser/i.test(ua) || /Pi Network/i.test(ua)) {
    return "pi-browser";
  }

  // Check for Pi SDK (testnet or local Pi SDK setup)
  if (typeof window.Pi !== "undefined" && typeof window.Pi.createPayment === "function") {
    return "testnet";
  }

  // Otherwise preview mode (simulator)
  return "preview";
}
