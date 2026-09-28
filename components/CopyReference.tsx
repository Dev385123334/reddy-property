"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyReference({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable (permissions / insecure context)
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Reference copied" : "Copy booking reference"}
      className="rounded-full p-1 text-ink-400 transition hover:text-gold-700"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-status-success" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
    </button>
  );
}