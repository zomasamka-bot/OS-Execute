"use client";

type Env = "pi-browser" | "testnet" | "preview";

interface EnvironmentBannerProps {
  env: Env;
}

const config: Record<Env, { label: string; sublabel: string; dot: string; bg: string; border: string; text: string } | null> = {
  "pi-browser": null, // No banner in production Pi Browser — everything is live
  testnet: {
    label: "Testnet Mode",
    sublabel: "Pi SDK detected — real payments will use sandbox",
    dot: "bg-status-pending animate-pulse",
    bg: "bg-status-pending-bg",
    border: "border-status-pending/20",
    text: "text-status-pending",
  },
  preview: {
    label: "Preview Mode",
    sublabel: "Payments are simulated — connect via Pi Browser for live execution",
    dot: "bg-ex-label",
    bg: "bg-ex-surface-2",
    border: "border-ex-border",
    text: "text-ex-label",
  },
};

export function EnvironmentBanner({ env }: EnvironmentBannerProps) {
  const cfg = config[env];
  if (!cfg) return null;

  return (
    <div className={`${cfg.bg} border-b ${cfg.border}`}>
      <div className="max-w-md mx-auto px-4 py-2 flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
        <p className={`text-[10px] font-semibold ${cfg.text} leading-tight`}>
          {cfg.label}
          <span className="font-normal ml-1 opacity-80">&mdash; {cfg.sublabel}</span>
        </p>
      </div>
    </div>
  );
}
