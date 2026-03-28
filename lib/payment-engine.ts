import type { SDKLiteInstance } from "@/lib/sdklite-types";
import type { PaymentRecord } from "@/lib/payment-types";
import { detectEnvironment } from "@/lib/store";

// ---------------------------------------------------------------------------
// Reference ID generator
// ---------------------------------------------------------------------------
export function generateReferenceId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `OSX-${ts}-${rand}`;
}

// ---------------------------------------------------------------------------
// Pi SDK payment callbacks
// ---------------------------------------------------------------------------
interface PiCallbackHandlers {
  onApproval: (paymentId: string) => void;
  onComplete: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error) => void;
}

function invokePiCreatePayment(params: {
  amount: number;
  memo: string;
  referenceId: string;
  recipient: string;
  sender: string;
  handlers: PiCallbackHandlers;
}): void {
  const { amount, memo, referenceId, recipient, sender, handlers } = params;

  if (typeof window === "undefined" || !window.Pi || typeof window.Pi.createPayment !== "function") {
    throw new Error("Pi SDK not available. Ensure Pi Browser or testnet environment.");
  }

  console.log(`[OS Execute] Invoking Pi.createPayment:`, {
    amount,
    referenceId,
    recipient,
    sender,
  });

  // State tracking for payment flow
  let approvalFired = false;
  let completionFired = false;

  window.Pi.createPayment(
    {
      amount,
      memo,
      metadata: {
        referenceId,
        recipient,
        sender,
        app: "OS Execute",
        domain: "https://os-execute.vercel.app",
        network: process.env.NEXT_PUBLIC_PI_NETWORK || "testnet",
      },
    },
    {
      onReadyForServerApproval: async (paymentId: string) => {
        if (approvalFired) {
          console.log(`[TRACKING] APPROVE SKIPPED: ${paymentId} (already approved)`);
          return;
        }
        approvalFired = true;

        console.log(`[TRACKING] APPROVE CALLBACK FIRED: ${paymentId}`);
        
        try {
          // Call approve API - this enables the Pioneer to submit the blockchain transaction
          const approveResponse = await fetch("/api/payments/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          });

          if (!approveResponse.ok) {
            throw new Error("Approval API failed");
          }

          console.log(`[TRACKING] APPROVE API SUCCESS`);
          handlers.onApproval(paymentId);
          
          // WAIT for onReadyForServerCompletion which will be called by Pi SDK
          // DO NOT call complete here - that's the mistake we were making

        } catch (err) {
          console.error(`[TRACKING] APPROVE ERROR:`, err);
          approvalFired = false;
          handlers.onError(err instanceof Error ? err : new Error(String(err)));
        }
      },

      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        // This is called by Pi SDK AFTER the Pioneer submits the blockchain transaction
        // The txid is the REAL transaction ID from the blockchain
        if (completionFired) {
          console.log(`[TRACKING] COMPLETE SKIPPED: ${paymentId} (already completed)`);
          return;
        }
        completionFired = true;

        console.log(`[TRACKING] COMPLETE CALLBACK FIRED: paymentId=${paymentId}, txid=${txid}`);
        
        try {
          // Call complete API with the REAL txid from the blockchain
          const completeResponse = await fetch("/api/payments/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId, txid }),
          });

          if (!completeResponse.ok) {
            throw new Error("Completion API failed");
          }

          const completeData = await completeResponse.json();
          console.log(`[TRACKING] COMPLETE API RESPONSE: status=${completeData.status}`);

          if (completeData.status === "completed") {
            handlers.onComplete(paymentId, txid);
            console.log(`[TRACKING] PAYMENT FULLY COMPLETE`);
          } else {
            throw new Error(`Completion failed: ${completeData.status}`);
          }

        } catch (err) {
          console.error(`[TRACKING] COMPLETE ERROR:`, err);
          completionFired = false;
          handlers.onError(err instanceof Error ? err : new Error(String(err)));
        }
      },

      onCancel: (paymentId: string) => {
        console.error(`[TRACKING] PAYMENT CANCELLED: ${paymentId}`);
        handlers.onCancel(paymentId);
      },

      onError: (error: Error, payment?: unknown) => {
        console.error(`[TRACKING] PAYMENT ERROR:`, error?.message);
        handlers.onError(error);
      },
    }
  );
}

// ---------------------------------------------------------------------------
// Main execution entry point
// ---------------------------------------------------------------------------
export interface ExecutePaymentParams {
  sdk: SDKLiteInstance | null;
  sender: string;
  recipient: string;
  amount: number;
  memo: string;
  referenceId: string;
  environment: string;
}

export async function executePiPayment(params: ExecutePaymentParams): Promise<PaymentRecord> {
  const { sdk, sender, recipient, amount, memo, referenceId, environment } = params;

  const base: PaymentRecord = {
    referenceId,
    sender,
    recipient,
    amount,
    memo: memo || "OS Execute Action",
    status: "pending",
    timestamp: new Date().toISOString(),
  };

  const env = environment || detectEnvironment();
  console.log(`[OS Execute] Executing payment in ${env} environment`);

  // -------------------------------------------------------------------
  // REAL ENVIRONMENTS: pi-browser, testnet
  // Use actual Pi SDK. If it fails, propagate error — NO FALLBACK.
  // -------------------------------------------------------------------
  if (env === "pi-browser" || env === "testnet") {
    console.log(`[TRACKING] PAYMENT FLOW START: env=${env}, referenceId=${referenceId}`);
    
    // Wait for Pi SDK to be fully ready before attempting payment
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds at 100ms intervals
    
    while (!window.Pi || typeof window.Pi.createPayment !== "function") {
      if (attempts >= maxAttempts) {
        throw new Error(
          `Pi SDK not available in ${env} environment after 5 seconds. ` +
          `This should only happen if: (1) Pi Browser is not running, or ` +
          `(2) Pi SDK initialization failed. Check browser console.`
        );
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    console.log(`[TRACKING] Pi SDK ready, invoking payment flow`);

    try {
      const result = await new Promise<{ paymentId: string; txid: string }>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Payment timed out after 60 seconds. Please check your connection and try again."));
        }, 60000);

        try {
          invokePiCreatePayment({
            amount,
            memo: base.memo,
            referenceId,
            recipient,
            sender,
            handlers: {
              onApproval: (paymentId) => {
                console.log(`[TRACKING] MAIN HANDLER onApproval called`);
              },
              onComplete: (paymentId, txid) => {
                clearTimeout(timeout);
                console.log(`[TRACKING] MAIN HANDLER onComplete called - resolving promise`);
                resolve({ paymentId, txid });
              },
              onCancel: () => {
                clearTimeout(timeout);
                console.log(`[TRACKING] Payment cancelled by user`);
                reject(new Error("Payment cancelled by user."));
              },
              onError: (err) => {
                clearTimeout(timeout);
                console.error(`[TRACKING] Payment error:`, err);
                reject(err);
              },
            },
          });
        } catch (err) {
          clearTimeout(timeout);
          reject(err);
        }
      });

      console.log(`[TRACKING] Payment flow SUCCESS: ${referenceId}`, result);
      return {
        ...base,
        paymentId: result.paymentId,
        txid: result.txid || undefined,
        status: result.txid ? "completed" : "pending",
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isCancelled = msg.toLowerCase().includes("cancel");
      
      if (isCancelled) {
        console.log(`[TRACKING] User cancelled execution`);
        throw err;
      }

      if (env === "pi-browser") {
        console.error(`[TRACKING] Pi Browser execution FAILED: ${msg}`);
        throw err;
      }

      console.error(`[TRACKING] Testnet execution FAILED: ${msg}`);
      throw err;
    }
  }

  // -------------------------------------------------------------------
  // SIMULATION ONLY (preview, non-Pi environments)
  // This is for development/testing ONLY when Pi SDK is unavailable.
  // -------------------------------------------------------------------
  if (env === "preview") {
    console.log(`[OS Execute] → Simulation mode (${env} environment — Pi SDK unavailable)`);
    console.warn(`[OS Execute] ⚠ This is a simulated execution. Real payment will NOT be processed.`);
    
    await new Promise((r) => setTimeout(r, 2200));

    const simPaymentId = `PAY-SIM-${generateReferenceId()}`;
    const simTxid = `TX${Math.random().toString(36).slice(2, 18).toUpperCase()}SIM`;

    return {
      ...base,
      paymentId: simPaymentId,
      txid: simTxid,
      status: "completed",
    };
  }

  // Unknown environment
  throw new Error(`Unsupported environment: ${env}`);
}
