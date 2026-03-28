"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

interface WalletUser {
  username: string;
  uid: string;
}

interface WalletContextType {
  user: WalletUser | null;
  status: "disconnected" | "connecting" | "connected" | "error";
  errorMessage: string;
  connect: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

declare global {
  interface Window {
    Pi: any;
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<WalletUser | null>(null);
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");
  const [errorMessage, setErrorMessage] = useState("");

  // ONLY access localStorage inside useEffect - never during render
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pi_wallet_session");
      if (saved) {
        const session = JSON.parse(saved);
        setUser(session);
        setStatus("connected");
      }
    } catch (e) {
      localStorage.removeItem("pi_wallet_session");
    }
  }, []);

  const connect = useCallback(() => {
    console.log("[v0] BUTTON CLICKED - connect() function called");
    console.log("[v0] window.Pi available:", !!window.Pi);
    console.log("[v0] window.Pi object:", window.Pi);
    
    setStatus("connecting");
    setErrorMessage("");

    if (!window.Pi) {
      console.error("[v0] ERROR: window.Pi is undefined");
      setErrorMessage("Pi SDK not available. Please open in Pi Browser.");
      setStatus("error");
      return;
    }

    console.log("[v0] Calling window.Pi.authenticate()...");
    window.Pi.authenticate()
      .then((auth: any) => {
        console.log("[v0] authenticate() success:", auth);
        if (auth?.user?.uid) {
          const walletUser: WalletUser = {
            username: auth.user.username || auth.user.uid,
            uid: auth.user.uid,
          };
          try {
            localStorage.setItem("pi_wallet_session", JSON.stringify(walletUser));
          } catch (e) {
            console.error("Failed to save session:", e);
          }
          setUser(walletUser);
          setStatus("connected");
          setErrorMessage("");
          console.log("[v0] Connection successful!");
        } else {
          console.error("[v0] No user.uid in auth response");
          setErrorMessage("No user data in response");
          setStatus("error");
        }
      })
      .catch((err: any) => {
        console.error("[v0] authenticate() error:", err);
        setErrorMessage(err?.message || "Connection failed");
        setStatus("error");
      });
  }, []);

  const disconnect = useCallback(() => {
    try {
      localStorage.removeItem("pi_wallet_session");
    } catch (e) {
      console.error("Failed to clear session:", e);
    }
    setUser(null);
    setStatus("disconnected");
    setErrorMessage("");
  }, []);

  const value: WalletContextType = {
    user,
    status,
    errorMessage,
    connect,
    disconnect,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}
