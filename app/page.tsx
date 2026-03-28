"use client";

import { useState, useEffect, useCallback } from "react";
import { ExecuteForm } from "@/components/execute-form";
import { PaymentReceipt } from "@/components/payment-receipt";
import { TransactionHistory } from "@/components/transaction-history";
import { WalletButton } from "@/components/wallet-button";
import { EnvironmentBanner } from "@/components/environment-banner";
import { EnvironmentDiagnostics } from "@/components/environment-diagnostics";
import { PaymentFlowTracker } from "@/components/payment-flow-tracker";
import { TechnicalReport } from "@/components/technical-report";
import {
  loadRecords,
  addRecord,
  subscribeSyncMessages,
  detectEnvironment,
} from "@/lib/store";
import type { PaymentRecord } from "@/lib/payment-types";

// ---------------------------------------------------------------------------
// Flow step definitions
// ---------------------------------------------------------------------------
const STEPS = ["Execute", "Payment", "Record", "Receipt", "Status"] as const;
type Step = typeof STEPS[number];

type View = "form" | "receipt" | "report";

function resolveStep(view: View, record: PaymentRecord | null): number {
  if (view === "form") return 0;
  if (view === "report") return 0;
  if (!record) return 3;
  if (record.status === "completed") return 4;
  if (record.status === "pending") return 3;
  return 4; // failed
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------
function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center" aria-label="Execution flow steps">
      {STEPS.map((step, i) => {
        const isActive = i === currentStep;
        const isPast = i < currentStep;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-ex-blue scale-125 shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
                    : isPast
                    ? "bg-status-success"
                    : "bg-ex-border-strong"
                }`}
              />
              <span
                className={`text-[9px] font-semibold uppercase tracking-wider leading-none transition-colors ${
                  isActive
                    ? "text-ex-blue"
                    : isPast
                    ? "text-status-success"
                    : "text-ex-label/40"
                }`}
              >
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-px mx-1.5 mb-3 transition-colors duration-300 ${
                  isPast ? "bg-status-success/35" : "bg-ex-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Domain badge
// ---------------------------------------------------------------------------
function DomainBadge() {
  return (
    <div className="flex items-center gap-1.5 bg-ex-blue/8 border border-ex-blue/20 rounded-full px-2.5 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-ex-blue shrink-0" />
      <span className="text-[10px] font-mono font-semibold text-ex-blue tracking-wide">os.pi</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function HomePage() {
  const [view, setView] = useState<View>("form");
  const [currentReceipt, setCurrentReceipt] = useState<PaymentRecord | null>(null);
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [env] = useState(() => (typeof window !== "undefined" ? detectEnvironment() : "preview"));
  const [walletUser, setWalletUser] = useState<{ username: string; uid: string } | null>(null);

  // Initial load
  useEffect(() => {
    setRecords(loadRecords());
  }, []);

  // Cross-tab record sync
  useEffect(() => {
    const unsub = subscribeSyncMessages((msg) => {
      if (msg.type === "RECORDS_UPDATED") {
        setRecords(msg.records);
      }
    });
    return unsub;
  }, []);

  const handleSuccess = useCallback((record: PaymentRecord) => {
    const updated = addRecord(record);
    setRecords(updated);
    setCurrentReceipt(record);
    setView("receipt");
  }, []);

  const handleReset = useCallback(() => {
    setCurrentReceipt(null);
    setView("form");
  }, []);

  const handleSelectRecord = useCallback((record: PaymentRecord) => {
    setCurrentReceipt(record);
    setView("receipt");
  }, []);

  const handleOpenReport = useCallback(() => {
    setView("report");
  }, []);

  const handleCloseReport = useCallback(() => {
    setView("form");
  }, []);

  const currentStep = resolveStep(view, currentReceipt);

  return (
    <main className="min-h-screen bg-background flex flex-col">

      {/* Payment flow tracker - shows console logs in real-time */}
      <PaymentFlowTracker />

      {/* Environment banner */}
      <EnvironmentBanner env={env} />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-background border-b border-ex-border">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Wordmark + domain */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-ex-blue flex items-center justify-center shrink-0">
              <svg
                className="w-3.5 h-3.5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div className="leading-none">
              <p className="text-sm font-bold text-ex-navy tracking-tight leading-none">OS Execute</p>
              <div className="flex items-center gap-1.5 mt-1">
                <DomainBadge />
      </div>

      {/* Environment diagnostics - shows origin, referrer, iframe status */}
      <EnvironmentDiagnostics />
            </div>
          </div>

          {/* Wallet connect */}
          <WalletButton onUserChange={setWalletUser} />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 max-w-md mx-auto w-full px-4 py-5 flex flex-col gap-5">

        {/* Step indicator — only show on form/receipt views */}
        {view !== "report" && (
          <StepIndicator currentStep={currentStep} />
        )}

        {/* Main card */}
        <section className="bg-ex-surface border border-ex-border rounded-2xl overflow-hidden shadow-sm">

          {/* Card header */}
          <div className="px-5 py-4 border-b border-ex-border flex items-start justify-between gap-3">
            <div>
              <h1 className="text-[15px] font-bold text-ex-navy leading-tight">
                {view === "form" && "Execute Action"}
                {view === "receipt" && "Execution Receipt"}
                {view === "report" && "Technical Report"}
              </h1>
              <p className="text-[11px] text-ex-label mt-0.5">
                {view === "form" && "Initiate a verified operational execution on Pi Network"}
                {view === "receipt" && currentReceipt && `Ref: ${currentReceipt.referenceId}`}
                {view === "report" && "Build summary · Sync architecture · Testnet readiness"}
              </p>
            </div>
            {(view === "receipt" || view === "report") && (
              <button
                onClick={view === "report" ? handleCloseReport : handleReset}
                className="text-xs font-semibold text-ex-blue hover:opacity-70 transition-opacity shrink-0 mt-0.5 flex items-center gap-1"
                aria-label="Go back"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Back
              </button>
            )}
          </div>

          {/* Card body */}
          <div className="px-5 py-5">
            {view === "form" && <ExecuteForm walletUser={walletUser} onSuccess={handleSuccess} />}
            {view === "receipt" && currentReceipt && (
              <PaymentReceipt record={currentReceipt} onReset={handleReset} />
            )}
            {view === "report" && <TechnicalReport env={env} />}
          </div>
        </section>

        {/* Execution log — only on form view */}
        {view === "form" && records.length > 0 && (
          <TransactionHistory records={records} onSelect={handleSelectRecord} />
        )}

      </div>

      {/* Footer */}
      <footer className="max-w-md mx-auto w-full px-4 pb-6">
        <div className="border-t border-ex-border pt-4 flex items-center justify-between">
          <p className="text-[10px] text-ex-label font-mono">
            OS Execute · os.pi · Pi Network
          </p>
          <button
            onClick={handleOpenReport}
            className="text-[10px] text-ex-label font-medium hover:text-ex-blue transition-colors underline underline-offset-2"
          >
            Technical Report
          </button>
        </div>
      </footer>

    </main>
  );
}
