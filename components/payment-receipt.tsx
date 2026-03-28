"use client";

import { useState } from "react";
import type { PaymentRecord } from "@/lib/payment-types";

interface PaymentReceiptProps {
  record: PaymentRecord;
  onReset: () => void;
}

function StatusBadge({ status }: { status: PaymentRecord["status"] }) {
  const cfg = {
    completed: {
      label: "Completed",
      textCls: "text-status-success",
      bgCls: "bg-status-success-bg border-status-success/20",
      dotCls: "bg-status-success",
    },
    pending: {
      label: "Pending",
      textCls: "text-status-pending",
      bgCls: "bg-status-pending-bg border-status-pending/20",
      dotCls: "bg-status-pending animate-pulse",
    },
    failed: {
      label: "Failed",
      textCls: "text-status-error",
      bgCls: "bg-status-error-bg border-status-error/20",
      dotCls: "bg-status-error",
    },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1.5 border rounded-full px-2.5 py-1 ${cfg.bgCls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotCls}`} />
      <span className={`text-xs font-semibold ${cfg.textCls}`}>{cfg.label}</span>
    </span>
  );
}

function Row({ label, value, mono = false, copyable = false }: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-ex-border last:border-0">
      <span className="text-xs text-ex-label font-medium uppercase tracking-wider shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`text-xs text-right break-all ${mono ? "font-mono text-foreground" : "text-foreground"}`}>
          {value}
        </span>
        {copyable && (
          <button
            onClick={handleCopy}
            aria-label="Copy"
            className="shrink-0 text-ex-label hover:text-ex-blue transition-colors"
          >
            {copied ? (
              <svg className="w-3.5 h-3.5 text-status-success" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9 3.75H9M7.5 21h9" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export function PaymentReceipt({ record, onReset }: PaymentReceiptProps) {
  const date = new Date(record.timestamp).toLocaleString("en-US", {
    month: "short", day: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });

  const iconConfig = {
    completed: {
      bg: "bg-status-success-bg",
      border: "border-status-success/25",
      icon: (
        <svg className="w-7 h-7 text-status-success" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ),
    },
    pending: {
      bg: "bg-status-pending-bg",
      border: "border-status-pending/25",
      icon: (
        <svg className="w-6 h-6 text-status-pending animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ),
    },
    failed: {
      bg: "bg-status-error-bg",
      border: "border-status-error/25",
      icon: (
        <svg className="w-6 h-6 text-status-error" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
  }[record.status];

  return (
    <div className="flex flex-col gap-5">
      {/* Status header */}
      <div className="flex flex-col items-center gap-3 py-2">
        <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center ${iconConfig.bg} ${iconConfig.border}`}>
          {iconConfig.icon}
        </div>
        <div className="flex flex-col items-center gap-2">
          <StatusBadge status={record.status} />
          <p className="text-3xl font-mono font-bold text-foreground tracking-tight">
            {record.amount.toFixed(2)}{" "}
            <span className="text-base font-normal text-ex-label">PI</span>
          </p>
          <p className="text-xs text-ex-label">{date}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="relative flex items-center gap-3">
        <div className="flex-1 border-t border-ex-border" />
        <span className="text-[10px] font-semibold text-ex-label uppercase tracking-widest">Receipt</span>
        <div className="flex-1 border-t border-ex-border" />
      </div>

      {/* Detail rows */}
      <div className="border border-ex-border rounded-xl overflow-hidden divide-y divide-ex-border bg-ex-surface">
        <div className="px-4">
          <Row label="Reference" value={record.referenceId} mono copyable />
          {record.paymentId && <Row label="Payment ID" value={record.paymentId} mono copyable />}
          {record.txid && <Row label="TX ID" value={record.txid} mono copyable />}
          <Row label="From" value={record.sender} mono />
          <Row label="To" value={record.recipient} mono />
          <Row label="Amount" value={`${record.amount.toFixed(6)} PI`} mono />
          {record.memo && <Row label="Memo" value={record.memo} />}
          <Row label="Time" value={date} mono />
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={onReset}
        className="w-full py-3.5 rounded-lg font-semibold text-sm bg-ex-blue text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        New Execution
      </button>
    </div>
  );
}
