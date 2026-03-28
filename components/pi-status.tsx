"use client";

import { useEffect, useState } from "react";

export function PiStatus() {
  const [piAvailable, setPiAvailable] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check immediately
    if (typeof window !== "undefined" && window.Pi) {
      setPiAvailable(true);
      setMessage("Ready");
      return;
    }

    // Poll for 10 seconds
    let checks = 0;
    const maxChecks = 100;
    
    const checkInterval = setInterval(() => {
      checks++;
      if (typeof window !== "undefined" && window.Pi) {
        setPiAvailable(true);
        setMessage("Ready");
        clearInterval(checkInterval);
      } else if (checks >= maxChecks) {
        setPiAvailable(false);
        setMessage("Unavailable");
        clearInterval(checkInterval);
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, []);

  if (!mounted) return null;
  
  if (piAvailable === null) {
    return (
      <div className="text-xs px-3 py-1.5 rounded-lg bg-status-pending-bg text-status-pending border border-status-pending/20">
        Checking...
      </div>
    );
  }

  if (piAvailable) {
    return (
      <div className="text-xs px-3 py-1.5 rounded-lg bg-status-success/10 text-status-success border border-status-success/20">
        {message}
      </div>
    );
  }

  return (
    <div className="text-xs px-3 py-1.5 rounded-lg bg-status-error-bg text-status-error border border-status-error/20">
      {message}
    </div>
  );
}
