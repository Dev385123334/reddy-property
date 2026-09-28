import type { ReactNode } from "react";

type Tone = "success" | "danger" | "warning" | "info";

const TONE_STYLES: Record<Tone, string> = {
  success: "border-status-success/20 bg-status-success/5 text-ink-800",
  danger: "border-status-danger/25 bg-status-danger/5 text-ink-800",
  warning: "border-status-warning/25 bg-status-warning/8 text-ink-800",
  info: "border-gold-500/25 bg-gold-500/8 text-ink-800",
};

export default function StatusBanner({
  children,
  tone = "info",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={`flex items-start gap-2.5 rounded-xl border px-4 py-3.5 text-sm leading-relaxed ${TONE_STYLES[tone]} ${className}`}
    >
      {children}
    </div>
  );
}