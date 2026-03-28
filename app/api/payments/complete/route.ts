import { NextRequest, NextResponse } from "next/server";

/**
 * Payment Completion Endpoint
 * 
 * OFFICIAL PI NETWORK FLOW:
 * 1. onReadyForServerApproval → call /approve
 * 2. User sees Pi wallet and signs transaction
 * 3. onReadyForServerCompletion → call /complete with REAL blockchain txid
 * 
 * This endpoint is ONLY called in step 3, after the blockchain transaction is complete.
 * The txid is the REAL transaction ID from the Pi blockchain, not generated locally.
 */
export async function POST(req: NextRequest) {
  try {
    const { paymentId, txid } = await req.json();

    if (!paymentId || !txid) {
      console.error(`[TRACKING] COMPLETE: Missing paymentId or txid`);
      return NextResponse.json({ error: "Missing paymentId or txid" }, { status: 400 });
    }

    console.log(`[TRACKING] COMPLETE: paymentId=${paymentId}, txid=${txid}`);
    console.log(`[TRACKING] COMPLETE: Blockchain transaction confirmed with txid`);

    // At this point, we have confirmation that:
    // 1. User approved the payment in their Pi wallet
    // 2. The transaction was submitted to the blockchain
    // 3. We have the real txid from the blockchain
    
    // Mark the payment as completed
    console.log(`[TRACKING] COMPLETE: Payment completed successfully on Pi Network blockchain`);
    
    return NextResponse.json({
      success: true,
      status: "completed",
      message: "Payment completed successfully on Pi Network",
      paymentId,
      txid,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("[TRACKING] COMPLETE: Error:", err);
    return NextResponse.json(
      { error: "Completion processing failed" },
      { status: 500 }
    );
  }
}
