"use client";

import { useState } from "react";
import { usePi } from "./pi-provider";

declare global {
  interface Window {
    Pi: any;
  }
}

interface WalletButtonProps {
  onUserChange?: (user: { username: string; uid: string } | null) => void;
}

export function WalletButton({ onUserChange }: WalletButtonProps) {
  const [user, setUser] = useState<{ username: string; uid: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { piReady, piError } = usePi();

  const handleConnect = async () => {
    setLoading(true);
    setError("");

    try {
      // Ensure Pi SDK is ready before attempting authentication
      if (!piReady) {
        throw new Error(piError || "Pi SDK not available");
      }

      // Access window.Pi only inside async handler (safe from SSR)
      if (typeof window === "undefined" || !window.Pi) {
        throw new Error("Pi SDK not available");
      }

      if (typeof window.Pi.authenticate !== "function") {
        throw new Error("Pi.authenticate is not available");
      }

      // Call authenticate with required scopes for wallet and payments
      const auth = await window.Pi.authenticate(
        ["username", "payments"],
        function onIncompletePaymentFound(payment: any) {
          // Handle incomplete payments if needed
        }
      );

      if (auth?.user?.uid) {
        const userData = {
          username: auth.user.username || auth.user.uid,
          uid: auth.user.uid,
        };
        setUser(userData);
        setError("");
        onUserChange?.(userData);
      } else {
        throw new Error("Authentication succeeded but no user data returned");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      setUser(null);
      onUserChange?.(null);
    } finally {
      setLoading(false);
    }
  };

  // Connected
  if (user) {
    return (
      <button className="flex items-center gap-2 px-3 py-1.5 bg-ex-surface border border-ex-border rounded-lg text-xs font-semibold">
        <span className="w-2 h-2 rounded-full bg-status-success" />
        <span className="text-foreground">@{user.username}</span>
      </button>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-2">
        <button
          onClick={handleConnect}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-status-error-bg text-status-error border border-status-error/20 rounded-lg text-xs font-semibold hover:border-status-error/40 transition-colors disabled:opacity-50"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          Retry
        </button>
        <p className="text-xs text-status-error">{error}</p>
      </div>
    );
  }

  // Connecting
  if (loading) {
    return (
      <button disabled className="flex items-center gap-2 px-3 py-1.5 bg-status-pending-bg text-status-pending border border-status-pending/20 rounded-lg text-xs font-semibold cursor-not-allowed opacity-60">
        <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Connecting...
      </button>
    );
  }

  // Pi SDK not ready
  if (!piReady) {
    return (
      <button disabled className="flex items-center gap-2 px-3 py-1.5 bg-status-pending-bg text-status-pending border border-status-pending/20 rounded-lg text-xs font-semibold cursor-not-allowed opacity-60">
        <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Initializing Pi SDK...
      </button>
    );
  }

  // Disconnected
  return (
    <button
      onClick={handleConnect}
      className="flex items-center gap-2 px-3.5 py-2 bg-ex-blue text-primary-foreground rounded-lg hover:opacity-90 active:scale-[0.97] text-xs font-semibold transition-all"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3m18 0H3" />
      </svg>
      Connect Wallet
    </button>
  );
}
