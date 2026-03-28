export interface PaymentRecord {
  referenceId: string;
  paymentId?: string;
  txid?: string;
  sender: string;
  recipient: string;
  amount: number;
  memo: string;
  status: "completed" | "pending" | "failed";
  timestamp: string;
}
