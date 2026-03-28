"use client";

import { useEffect, useState } from "react";

export function EnvironmentDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<{
    origin: string;
    referrer: string;
    isInIframe: boolean;
    parentOrigin: string;
    topOrigin: string;
    href: string;
    userAgent: string;
    piReady: boolean;
    piVersion: string;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const getDiagnostics = () => {
      try {
        const isInIframe = window.self !== window.top;
        let parentOrigin = "N/A";
        let topOrigin = "N/A";

        try {
          parentOrigin = window.parent?.location?.origin || "blocked by CORS";
        } catch (e) {
          parentOrigin = "blocked by CORS";
        }

        try {
          topOrigin = window.top?.location?.origin || "blocked by CORS";
        } catch (e) {
          topOrigin = "blocked by CORS";
        }

        const data = {
          origin: window.location.origin,
          referrer: document.referrer || "(empty)",
          isInIframe,
          parentOrigin,
          topOrigin,
          href: window.location.href,
          userAgent: navigator.userAgent,
          piReady: !!window.Pi,
          piVersion: window.Pi?.version || "N/A",
        };

        console.log("[v0] Environment diagnostics:", data);
        setDiagnostics(data);
      } catch (err) {
        console.error("[Diagnostics] Error:", err);
      }
    };

    getDiagnostics();
  }, []);

  if (!mounted || !diagnostics) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-ex-surface border border-ex-border rounded-lg p-3 max-w-xs text-xs font-mono space-y-1 z-50">
      <div className="font-semibold text-foreground">Environment Diagnostics</div>
      <div>
        <span className="text-ex-label">Origin:</span> {diagnostics.origin}
      </div>
      <div>
        <span className="text-ex-label">Referrer:</span>{" "}
        {diagnostics.referrer || "(empty)"}
      </div>
      <div>
        <span className="text-ex-label">In Iframe:</span>{" "}
        {diagnostics.isInIframe ? "✓ Yes" : "✗ No"}
      </div>
      <div>
        <span className="text-ex-label">Parent Origin:</span>{" "}
        {diagnostics.parentOrigin}
      </div>
      <div>
        <span className="text-ex-label">Top Origin:</span> {diagnostics.topOrigin}
      </div>
      <div>
        <span className="text-ex-label">Pi SDK Ready:</span>{" "}
        {diagnostics.piReady ? "✓ Yes" : "✗ No"}
      </div>
      <div>
        <span className="text-ex-label">Pi Version:</span> {diagnostics.piVersion}
      </div>
      <div className="text-xs text-ex-label pt-2">
        Check browser console for full logs
      </div>
    </div>
  );
}
