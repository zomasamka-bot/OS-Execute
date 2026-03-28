"use client";

import { useState } from "react";
import type { PaymentRecord } from "@/lib/payment-types";

interface TransactionHistoryProps {
  records: PaymentRecord[];
  onSelect: (record: PaymentRecord) => void;
}

const statusDot = {
  completed: "bg-status-success",
  pending: "bg-status-pending animate-pulse",
  failed: "bg-status-error",
};

const statusLabel = {
  completed: "Completed",
  pending: "Pending",
  failed: "Failed",
};

export function TransactionHistory({ records, onSelect }: TransactionHistoryProps) {
  const [expanded, setExpanded] = useState(false);
  if (records.length === 0) return null;

  const displayed = expanded ? records : records.slice(0, 3);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-ex-label uppercase tracking-wider">
          Execution Log
        </h2>
        <span className="text-xs text-ex-label">
          {records.length} {records.length === 1 ? "record" : "records"}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {displayed.map((record) => {
          const date = new Date(record.timestamp).toLocaleString("en-US", {
            month: "short", day: "2-digit",
            hour: "2-digit", minute: "2-digit", hour12: false,
          });

          return (
            <button
              key={record.referenceId}
              onClick={() => onSelect(record)}
              className="flex items-center gap-3 bg-ex-surface border border-ex-border rounded-xl px-4 py-3.5 text-left hover:border-ex-blue/40 hover:shadow-sm transition-all active:scale-[0.99] w-full"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot[record.status]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground truncate">
                    {record.recipient.slice(0, 14)}...
                  </span>
                  <span className="text-sm font-mono font-semibold text-foreground shrink-0">
                    {record.amount.toFixed(2)} PI
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-xs font-mono text-ex-label truncate">
                    {record.referenceId}
                  </span>
                  <span className="text-xs text-ex-label shrink-0">{date}</span>
                </div>
              </div>
              <svg className="w-4 h-4 text-ex-label shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          );
        })}
      </div>

      {records.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-medium text-ex-blue text-center py-1.5 hover:opacity-70 transition-opacity"
        >
          {expanded ? "Show less" : `Show ${records.length - 3} more`}
        </button>
      )}
    </div>
  );
}
