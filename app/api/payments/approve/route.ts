import { NextRequest, NextResponse } from "next/server";

/**
 * Payment Approval Endpoint
 * Called by frontend when Pi SDK approves the payment
 * IMPORTANT: This does NOT mark the payment as successful
 * It only notifies the backend that the user has approved in their wallet
 * The payment is still in progress and waiting for final confirmation
 */
export async function POST(req: NextRequest) {
  try {
    const { paymentId } = await req.json();

    if (!paymentId) {
      console.error(`[TRACKING] APPROVE: Missing paymentId`);
      return NextResponse.json({ error: "Missing paymentId" }, { status: 400 });
    }

    console.log(`[TRACKING] APPROVE: paymentId=${paymentId} - user approved in wallet`);

    // IMPORTANT: At this point, the user has approved the payment in their wallet
    // But we do NOT know if it will complete successfully yet
    // The payment could still be cancelled, expired, or fail for other reasons
    // We only return "pending" - not "success"

    // In a real implementation, you would:
    // 1. Store that this payment was approved by the user (timestamp, user ID, etc)
    // 2. Wait for the actual transaction result from Pi Network
    // 3. Do NOT return success until Pi confirms the transaction is on-chain

    console.log(`[TRACKING] APPROVE: Payment approved by user - status is PENDING, awaiting completion`);
    
    return NextResponse.json({ 
      success: true,
      status: "pending",
      message: "Payment approved by user, awaiting completion confirmation from Pi Network",
      paymentId 
    });
  } catch (err) {
    console.error("[TRACKING] APPROVE: Error:", err);
    return NextResponse.json(
      { error: "Approval notification failed" },
      { status: 500 }
    );
  }
}
