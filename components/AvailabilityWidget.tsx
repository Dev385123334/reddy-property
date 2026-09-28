"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import DateRangePicker, { type DateRange } from "@/components/DateRangePicker";
import GuestsStepper from "@/components/GuestsStepper";
import PriceBreakdown from "@/components/PriceBreakdown";
import StatusBanner from "@/components/StatusBanner";
import type { Quote } from "@/lib/guesty/types";

interface AvailabilityWidgetProps {
  property: { id: string; title: string; guests: number };
}

type WidgetState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "available"; quote: Quote }
  | { status: "unavailable"; message: string }
  | { status: "error"; message: string };

export default function AvailabilityWidget({ property }: AvailabilityWidgetProps) {
  const router = useRouter();
  const [range, setRange] = useState<DateRange>({});
  const [guests, setGuests] = useState(() => Math.min(property.guests, 2));
  const [state, setState] = useState<WidgetState>({ status: "idle" });
  const [touched, setTouched] = useState(false);

  const check = async () => {
    setTouched(true);
    if (!range.checkIn || !range.checkOut) {
      setState({ status: "error", message: "Please select check-in and check-out dates." });
      return;
    }
    if (range.checkIn >= range.checkOut) {
      setState({ status: "error", message: "Check-out must be after check-in." });
      return;
    }
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/guesty/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          listingId: property.id,
          checkIn: range.checkIn,
          checkOut: range.checkOut,
          guests,
        }),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        quote?: { quoteId: string; total: number; currency: string; breakdown: Quote["breakdown"]; fingerprint: string };
        error?: { code: string; message: string };
      };
      if (!res.ok || !body.ok || !body.quote) {
        const message =
          body.error?.message ??
          "We couldn't check these dates right now. Please try again.";
        setState({
          status: body.error?.code === "LISTING_NOT_AVAILABLE" ? "unavailable" : "error",
          message,
        });
        return;
      }
      setState({
        status: "available",
        quote: {
          quoteId: body.quote.quoteId,
          listingId: property.id,
          checkIn: range.checkIn as string,
          checkOut: range.checkOut as string,
          guests,
          total: body.quote.total,
          currency: body.quote.currency,
          breakdown: body.quote.breakdown,
          fingerprint: body.quote.fingerprint,
        },
      });
    } catch {
      setState({
        status: "error",
        message: "We couldn't check these dates right now. Please try again.",
      });
    }
  };

  const continueToBooking = () => {
    router.push("/booking/checkout");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div>
          <span className="label-rp">Check-in &amp; check-out</span>
          <DateRangePicker value={range} onChange={setRange} />
        </div>
        <div>
          <GuestsStepper
            value={guests}
            onChange={setGuests}
            max={property.guests}
            label="Guests"
          />
          {property.guests > 0 && (
            <p className="mt-1.5 text-xs text-ink-400">
              Sleeps up to {property.guests} guests
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={check}
          disabled={state.status === "loading"}
          className="btn-gold btn-lg w-full"
        >
          {state.status === "loading" && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {state.status === "loading" ? "Checking availability…" : "Check availability & price"}
        </button>
      </div>

      {touched && state.status === "error" && (
        <StatusBanner tone="danger">{state.message}</StatusBanner>
      )}
      {state.status === "unavailable" && (
        <StatusBanner tone="danger">
          <XCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          {state.message}
        </StatusBanner>
      )}

      {state.status === "available" && state.quote && (
        <div className="animate-rdp-fade-up space-y-4 rounded-2xl bg-ivory-200/70 p-5 ring-1 ring-ink-900/10">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-status-success" aria-hidden="true" />
            <p className="text-sm font-medium text-ink-800">
              Your dates are available. Here&apos;s your live price from our booking system.
            </p>
          </div>
          <PriceBreakdown quote={state.quote} />
          <button type="button" onClick={continueToBooking} className="btn-dark btn-lg w-full">
            Continue to booking details
          </button>
          <p className="text-center text-xs text-ink-400">
            No payment is taken today. The price is guaranteed for 24 hours and
            reconfirmed before submission.
          </p>
        </div>
      )}
    </div>
  );
}