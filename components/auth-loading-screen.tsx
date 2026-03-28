"use client";

// Retained for compatibility — no longer used as a blocking gate.
// The app renders immediately; wallet connection is user-triggered via WalletButton.
export function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 gap-6">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
          <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        </div>
        <p className="text-sm font-bold text-foreground tracking-tight">OS Execute</p>
      </div>
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-border" />
        <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
      <p className="text-xs text-muted-foreground">Loading...</p>
    </div>
  );
}
