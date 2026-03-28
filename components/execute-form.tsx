"use client";

import { useState } from "react";
import type { PaymentRecord } from "@/lib/payment-types";
import { generateReferenceId, executePiPayment } from "@/lib/payment-engine";
import { detectEnvironment } from "@/lib/store";

interface ExecuteFormProps {
  walletUser: { username: string; uid: string } | null;
  onSuccess: (record: PaymentRecord) => void;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-medium text-ex-label uppercase tracking-wider mb-1.5 block">
      {children}
    </label>
  );
}

export function ExecuteForm({ walletUser, onSuccess }: ExecuteFormProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [execStatus, setExecStatus] = useState<"idle" | "executing" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [paymentInProgress, setPaymentInProgress] = useState(false);

  const isConnected = !!walletUser;

  const handleExecute = async () => {
    if (paymentInProgress) {
      console.log(`[OS Execute] Payment already in progress - ignoring duplicate click`);
      return;
    }

    if (!isConnected || !walletUser) {
      setErrorMsg("Please connect your wallet first.");
      setExecStatus("error");
      return;
    }

    const recipientTrimmed = recipient.trim();
    const amountTrimmed = amount.trim();

    if (!recipientTrimmed || !amountTrimmed) {
      setErrorMsg("Recipient wallet and amount are required.");
      setExecStatus("error");
      return;
    }

    const parsed = parseFloat(amountTrimmed);
    if (isNaN(parsed) || parsed <= 0) {
      setErrorMsg("Enter a valid amount greater than 0.");
      setExecStatus("error");
      return;
    }

    if (parsed > 1000000) {
      setErrorMsg("Amount exceeds maximum allowed value.");
      setExecStatus("error");
      return;
    }

    setExecStatus("executing");
    setErrorMsg("");
    setPaymentInProgress(true);

    try {
      console.log(`[TRACKING] EXECUTE START: referenceId=${generateReferenceId()}, wallet=${walletUser.username}, recipient=${recipientTrimmed}, amount=${parsed}`);
      const referenceId = generateReferenceId();
      const environment = detectEnvironment();
      console.log(`[TRACKING] Environment: ${environment}`);
      const record = await executePiPayment({
        sdk: null,
        sender: `@${walletUser.username}`,
        recipient: recipientTrimmed,
        amount: parsed,
        memo: memo.trim() || "OS Execute Action",
        referenceId,
        environment,
      });
      console.log(`[TRACKING] EXECUTE SUCCESS: ${referenceId} - status=${record.status}`);
      onSuccess(record);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Execution failed. Please try again.";
      console.error(`[TRACKING] EXECUTE FAILED: ${msg}`);
      setErrorMsg(msg);
      setExecStatus("error");
    } finally {
      setPaymentInProgress(false);
    }
  };

  const isExecuting = execStatus === "executing";
  const canExecute = isConnected && !isExecuting;

  return (
    <div className="flex flex-col gap-5">
      {/* Sender Wallet — auto-filled, read-only */}
      <div>
        <FieldLabel>Sender Wallet</FieldLabel>
        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-3 transition-colors ${
            isConnected
              ? "bg-ex-blue-light border-ex-blue/25"
              : "bg-ex-surface-2 border-ex-border"
          }`}
        >
          {isConnected && walletUser ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-status-success shrink-0" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-ex-navy">@{walletUser.username}</span>
                <span className="text-[11px] font-mono text-ex-label break-all leading-tight mt-0.5">
                  @{walletUser.username}
                </span>
              </div>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-ex-border-strong shrink-0" />
              <span className="text-sm text-ex-label">Wallet not connected</span>
            </>
          )}
        </div>
      </div>

      {/* Recipient Wallet */}
      <div>
        <FieldLabel>Recipient Wallet</FieldLabel>
        <input
          type="text"
          value={recipient}
          onChange={(e) => {
            setRecipient(e.target.value);
            if (execStatus === "error") setExecStatus("idle");
          }}
          placeholder="Enter recipient wallet address"
          disabled={isExecuting || !isConnected}
          className="w-full bg-ex-surface-2 border border-ex-border rounded-lg px-3 py-3 text-sm text-foreground placeholder:text-ex-label focus:outline-none focus:border-ex-blue focus:ring-1 focus:ring-ex-blue/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Amount */}
      <div>
        <FieldLabel>Amount (Pi)</FieldLabel>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (execStatus === "error") setExecStatus("idle");
            }}
            placeholder="0.00"
            min="0"
            step="0.01"
            max="1000000"
            disabled={isExecuting || !isConnected}
            className="w-full bg-ex-surface-2 border border-ex-border rounded-lg px-3 py-3 pr-14 text-sm font-mono text-foreground placeholder:text-ex-label focus:outline-none focus:border-ex-blue focus:ring-1 focus:ring-ex-blue/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ex-label">
            PI
          </span>
        </div>
      </div>

      {/* Memo */}
      <div>
        <FieldLabel>
          Memo / Description{" "}
          <span className="normal-case font-normal text-ex-label/70">(optional)</span>
        </FieldLabel>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Add a note to this execution"
          disabled={isExecuting || !isConnected}
          className="w-full bg-ex-surface-2 border border-ex-border rounded-lg px-3 py-3 text-sm text-foreground placeholder:text-ex-label focus:outline-none focus:border-ex-blue focus:ring-1 focus:ring-ex-blue/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Error */}
      {execStatus === "error" && (
        <div className="flex items-start gap-2 bg-status-error-bg border border-status-error/20 rounded-lg px-3 py-3">
          <svg
            className="w-4 h-4 text-status-error mt-0.5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p className="text-xs text-status-error leading-relaxed">{errorMsg}</p>
        </div>
      )}

      {/* Wallet not connected hint */}
      {!isConnected && (
        <div className="flex items-center gap-2 bg-ex-surface-2 border border-ex-border rounded-lg px-3 py-3">
          <svg
            className="w-4 h-4 text-ex-label shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>
          <p className="text-xs text-ex-label">
            Connect your wallet to initiate an execution action.
          </p>
        </div>
      )}

      {/* Execute button */}
      <button
        onClick={handleExecute}
        disabled={!canExecute}
        className="w-full py-3.5 rounded-lg font-semibold text-sm bg-ex-blue text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isExecuting ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Executing Action...
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
              />
            </svg>
            Execute Action
          </>
        )}
      </button>

      <p className="text-center text-xs text-ex-label">
        Operational execution via Pi Network · End-to-end verified
      </p>
    </div>
  );
}
