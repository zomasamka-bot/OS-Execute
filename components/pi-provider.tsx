"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from "react";

declare global {
  interface Window {
    Pi: any;
  }
}

interface PiContextType {
  piReady: boolean;
  piError: string | null;
}

const PiContext = createContext<PiContextType>({ piReady: false, piError: null });

export function PiProvider({ children }: { children: ReactNode }) {
  const [piReady, setPiReady] = useState(false);
  const [piError, setPiError] = useState<string | null>(null);

  useEffect(() => {
    // Function to initialize Pi SDK when available
    const initPi = () => {
      if (!window.Pi) {
        console.log("[v0] window.Pi not found");
        return false;
      }

      console.log("[v0] window.Pi detected");
      console.log("[v0] document.referrer:", document.referrer || "(empty)");
      console.log("[v0] window.location.origin:", window.location.origin);
      console.log("[v0] window.location.href:", window.location.href);
      console.log("[v0] window.self === window.top:", window.self === window.top);
      
      try {
        let parentOrigin = "N/A";
        if (window.self !== window.top) {
          try {
            parentOrigin = window.parent?.location?.origin || "blocked by CORS";
          } catch {
            parentOrigin = "blocked by CORS";
          }
        }
        console.log("[v0] Parent Origin (if iframe):", parentOrigin);
      } catch (e) {
        console.log("[v0] Could not access parent origin");
      }

      try {
        // Initialize Pi SDK with version 2.0 only
        window.Pi.init({
          version: "2.0",
        });

        console.log("[v0] Pi SDK initialized successfully");
        console.log("[v0] Pi.authenticate available:", typeof window.Pi.authenticate === "function");
        setPiReady(true);
        setPiError(null);
        return true;
      } catch (err) {
        console.log("[v0] Pi.init threw:", err);
        setPiReady(true);
        return true;
      }
    };

    let initialDelay: NodeJS.Timeout;
    let interval: NodeJS.Timer | undefined;

    // Delay first check by 500ms to allow defer script to execute
    initialDelay = setTimeout(() => {
      if (initPi()) {
        console.log("[v0] Pi SDK ready on initial check");
        return;
      }

      // Poll for Pi SDK to become available
      let attempts = 0;
      const maxAttempts = 200; // 20 seconds at 100ms intervals
      
      interval = setInterval(() => {
        attempts++;
        console.log(`[v0] Polling for Pi SDK... attempt ${attempts}/${maxAttempts}`);
        
        if (initPi()) {
          if (interval) clearInterval(interval);
          console.log("[v0] Pi SDK detected during polling");
        } else if (attempts >= maxAttempts) {
          if (interval) clearInterval(interval);
          console.error("[v0] Pi SDK not detected after 20 seconds");
          // In Pi Browser, window.Pi should be available. If not, it's an error.
          setPiReady(false);
          setPiError("Pi SDK not detected. Ensure you are in Pi Browser.");
        }
      }, 100);
    }, 500);

    return () => {
      clearTimeout(initialDelay);
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <PiContext.Provider value={{ piReady, piError }}>
      {children}
    </PiContext.Provider>
  );
}

export function usePi() {
  return useContext(PiContext);
}
