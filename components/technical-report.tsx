"use client";

import { loadRecords } from "@/lib/store";

type Env = "pi-browser" | "testnet" | "preview";

interface TechnicalReportProps {
  env: Env;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-[10px] font-semibold text-ex-label uppercase tracking-widest">
        {title}
      </h2>
      <div className="bg-ex-surface-2 border border-ex-border rounded-xl overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, mono = false, status }: {
  label: string;
  value: string;
  mono?: boolean;
  status?: "ok" | "warn" | "info";
}) {
  const statusDot = status === "ok"
    ? "bg-status-success"
    : status === "warn"
    ? "bg-status-pending"
    : undefined;

  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5 border-b border-ex-border last:border-0">
      <span className="text-xs text-ex-label shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        {statusDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot}`} />}
        <span className={`text-xs text-right break-all ${mono ? "font-mono text-foreground" : "text-foreground font-medium"}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

const envLabel: Record<Env, string> = {
  "pi-browser": "Pi Browser (Production)",
  testnet: "Testnet (Pi SDK detected)",
  preview: "Preview / Simulator",
};

const envReadiness: Record<Env, { label: string; status: "ok" | "warn" | "info" }> = {
  "pi-browser": { label: "Ready for production", status: "ok" },
  testnet: { label: "Ready for testnet trials", status: "ok" },
  preview: { label: "Simulation mode — open in Pi Browser for live", status: "warn" },
};

export function TechnicalReport({ env }: TechnicalReportProps) {
  const records = loadRecords();
  const completed = records.filter((r) => r.status === "completed").length;
  const pending = records.filter((r) => r.status === "pending").length;
  const failed = records.filter((r) => r.status === "failed").length;
  const readiness = envReadiness[env];

  return (
    <div className="flex flex-col gap-5">

      <Section title="Implementation">
        <Row label="App Name" value="OS Execute" />
        <Row label="Domain" value="os.pi" mono />
        <Row label="Version" value="1.0.0" mono />
        <Row label="Network" value="Pi Network" />
        <Row label="SDK" value="pi-sdk.js v2.0 + SDKLite" mono />
        <Row label="Flow" value="Execute Action → Record → Receipt → Status" />
        <Row label="System" value="Operational execution system with integrated payments" />
      </Section>

      <Section title="Synchronization Architecture">
        <Row label="Persistence" value="localStorage (key: os_execute_records_v1)" mono />
        <Row label="Cross-Tab Sync" value="BroadcastChannel API" status="ok" />
        <Row label="Channel Name" value="os_execute_sync" mono />
        <Row label="Wallet Session" value="localStorage (key: os_execute_wallet_session_v1)" mono />
        <Row label="State Model" value="Unified store — lib/store.ts" mono />
        <Row label="Fallback" value="localStorage polling for unsupported browsers" />
      </Section>

      <Section title="Execution Architecture">
        <Row label="Engine" value="lib/payment-engine.ts" mono />
        <Row label="Reference Format" value="OSX-{timestamp36}-{rand6}" mono />
        <Row label="Testnet Flow" value="Pi.createPayment → approval → completion" />
        <Row label="Sandbox" value="Auto-simulated when Pi SDK unavailable" status="ok" />
        <Row label="Metadata" value="referenceId, recipient, sender, domain: os.pi" mono />
        <Row label="Action Type" value="Integrated payment execution (scalable to any action)" />
      </Section>

      <Section title="Environment">
        <Row label="Detected" value={envLabel[env]} status="info" />
        <Row label="Testnet Ready" value={readiness.label} status={readiness.status} />
        <Row
          label="Pi Browser"
          value={env === "pi-browser" ? "Confirmed" : "Not detected"}
          status={env === "pi-browser" ? "ok" : "warn"}
        />
        <Row label="Pi SDK" value={env !== "preview" ? "Loaded" : "Not loaded"} status={env !== "preview" ? "ok" : "warn"} />
      </Section>

      <Section title="Execution Log Summary">
        <Row label="Total Records" value={String(records.length)} mono />
        <Row label="Completed" value={String(completed)} status={completed > 0 ? "ok" : "info"} />
        <Row label="Pending" value={String(pending)} status={pending > 0 ? "warn" : "info"} />
        <Row label="Failed" value={String(failed)} />
      </Section>

      <Section title="Developer Portal Checklist">
        <Row label="Authentication" value="Pi.init + SDKLite.login" status="ok" />
        <Row label="Execution Flow" value="Pi.createPayment with callbacks" status="ok" />
        <Row label="Approval Callback" value="onReadyForServerApproval" status="ok" />
        <Row label="Completion Callback" value="onReadyForServerCompletion" status="ok" />
        <Row label="Cancel Handling" value="onCancel propagated to UI" status="ok" />
        <Row label="Error Handling" value="onError + graceful fallback" status="ok" />
        <Row label="Sandbox Flag" value="system-config.ts · SANDBOX: false" status="ok" />
      </Section>

      <p className="text-center text-[10px] text-ex-label font-mono pt-1">
        OS Execute · os.pi · Generated {new Date().toUTCString()}
      </p>
    </div>
  );
}
