"use client";

import { useEffect, useState } from "react";

export function PiDebug() {
  const [piStatus, setPiStatus] = useState<string>("");
  const [scriptLoadStatus, setScriptLoadStatus] = useState<string>("");
  const [environment, setEnvironment] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Detect environment
    const isPreview = typeof window !== "undefined" && window.location.hostname.includes("v0.app");
    setEnvironment(isPreview ? "v0 Preview" : "Published App");

    // Check script loading status
    if (typeof window !== "undefined") {
      const loadSuccess = (window as any).__piLoadSuccess;
      if (loadSuccess === undefined) {
        setScriptLoadStatus("Script tag present (waiting)");
      } else if (loadSuccess === true) {
        setScriptLoadStatus("Script loaded");
      } else {
        setScriptLoadStatus("Script failed");
      }
    }

    // Check for Pi SDK
    if (typeof window !== "undefined" && window.Pi) {
      setPiStatus("Pi SDK Ready");
    } else {
      setPiStatus("Pi SDK Unavailable");
    }
  }, []);

  if (!mounted) return null;

  return (
    <div className="text-xs text-ex-label mt-3 p-3 bg-ex-surface-2 rounded border border-ex-border space-y-1.5">
      <div><strong>Env:</strong> {environment || "..."}</div>
      <div><strong>Script:</strong> {scriptLoadStatus || "..."}</div>
      <div><strong>Pi SDK:</strong> {piStatus || "..."}</div>
    </div>
  );
}
