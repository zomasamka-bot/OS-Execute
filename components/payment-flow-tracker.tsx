"use client";

import { useEffect, useState } from "react";

interface PaymentEvent {
  step: string;
  timestamp: number;
  status: "info" | "success" | "error";
  details: string;
}

export function PaymentFlowTracker() {
  const [events, setEvents] = useState<PaymentEvent[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Intercept console.log to capture [TRACKING] messages
    const originalLog = console.log;
    const originalError = console.error;

    const captureLog = (type: "info" | "error") => (...args: any[]) => {
      const message = args.join(" ");
      
      if (message.includes("[TRACKING]")) {
        const step = message.replace("[TRACKING]", "").trim().split(":")[0];
        const details = message;
        const isError = type === "error";
        
        setEvents(prev => [...prev, {
          step,
          timestamp: Date.now(),
          status: isError ? "error" : "success",
          details,
        }]);
      }
    };

    console.log = captureLog("info");
    console.error = captureLog("error");

    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  if (!mounted || events.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-md max-h-64 overflow-auto bg-ex-surface border border-ex-border rounded-lg p-3 text-xs font-mono z-50">
      <div className="font-bold mb-2 text-ex-label">Payment Flow</div>
      <div className="space-y-1">
        {events.map((event, i) => (
          <div key={i} className={`text-${event.status === "error" ? "status-error" : "status-success"}`}>
            <div>{event.step}</div>
            <div className="text-xs opacity-70">{event.details}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
