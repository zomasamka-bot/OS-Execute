"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    Pi: any;
  }
}

/**
 * Guarantee Pi SDK is fully initialized and ready for use
 * Returns promise that resolves when Pi.createPayment is available
 */
export async function waitForPiSDK(maxWaitMs = 10000): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    if (typeof window !== "undefined" && window.Pi && typeof window.Pi.createPayment === "function") {
      console.log("[Pi SDK] Ready and fully initialized");
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  throw new Error(`Pi SDK not ready after ${maxWaitMs}ms. Pi.createPayment not available.`);
}

/**
 * Hook to ensure Pi SDK is ready before operations
 */
export function usePiSDKReady() {
  const readyRef = useRef(false);
  
  useEffect(() => {
    let mounted = true;
    
    const initializePiSDK = async () => {
      try {
        await waitForPiSDK();
        if (mounted) {
          readyRef.current = true;
        }
      } catch (err) {
        console.error("[Pi SDK] Initialization failed:", err);
        if (mounted) {
          readyRef.current = false;
        }
      }
    };
    
    initializePiSDK();
    
    return () => {
      mounted = false;
    };
  }, []);
  
  return {
    isPiReady: () => readyRef.current,
    ensurePiReady: waitForPiSDK,
  };
}
