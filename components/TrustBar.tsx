import { Check, Zap, BadgeCheck, ShieldCheck } from "lucide-react";

const TRUST_ITEMS = [
  { icon: Zap, text: "Live availability" },
  { icon: ShieldCheck, text: "Price guaranteed 24h" },
  { icon: Check, text: "No payment today" },
  { icon: BadgeCheck, text: "Personal confirmation" },
];

export default function TrustBar() {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs uppercase tracking-[0.18em] text-ivory-100/85 sm:text-[11px]">
      {TRUST_ITEMS.map(({ icon: Icon, text }, i) => (
        <span key={text} className="inline-flex items-center gap-1.5">
          {i > 0 && <span className="mr-4 hidden h-1 w-1 rounded-full bg-gold-300/70 sm:inline-flex" />}
          <Icon className="h-3.5 w-3.5 text-gold-300" aria-hidden="true" />
          {text}
        </span>
      ))}
    </div>
  );
}