"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import StatusBanner from "@/components/StatusBanner";
import { guestDetailsSchema } from "@/lib/validators";
import { formatPrice } from "@/lib/utils/format";
import { formatDateRange, nightsBetween } from "@/lib/utils/dates";
import type { Quote } from "@/lib/guesty/types";

interface CheckoutFormProps {
  session: {
    id: string;
    listingId: string;
    quoteId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  };
  quote: Pick<Quote, "total" | "currency" | "fingerprint">;
  propertyTitle: string;
}

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string }
  | { status: "quote_changed"; quote: FreshQuote }
  | { status: "payment_required"; message: string };

interface FreshQuote {
  quoteId: string;
  total: number;
  currency: string;
  fingerprint: string;
  breakdown: Quote["breakdown"];
}

/** Guest fields as declared by guestDetailsSchema (zod) minus computed bits. */
interface GuestFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  postalCode: string;
  guestsCount: string;
  specialRequests: string;
}

const EMPTY_GUEST: GuestFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  country: "",
  city: "",
  address: "",
  postalCode: "",
  guestsCount: "1",
  specialRequests: "",
};

interface ZodErrorIssue {
  path: (string | number)[];
  message: string;
}

interface ZodErrorLike {
  errors: ZodErrorIssue[];
}

function fieldErrors(error: ZodErrorLike): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.errors) {
    const key = issue.path.join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

export default function CheckoutForm({ session, quote, propertyTitle }: CheckoutFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<GuestFormValues>(EMPTY_GUEST);
  const [fieldProblems, setFieldProblems] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const [fresh, setFresh] = useState<FreshQuote | null>(null);
  const [activeQuoteId, setActiveQuoteId] = useState(session.quoteId);

  const setField = (key: keyof GuestFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (fieldProblems[key]) {
      setFieldProblems((p) => {
        const next = { ...p };
        delete next[key];
        return next;
      });
    }
  };

  const submit = async () => {
    const guestPayload = {
      ...values,
      postalCode: values.postalCode || undefined,
      specialRequests: values.specialRequests || undefined,
      guestsCount: Number(values.guestsCount || 1),
    };

    const parsed = guestDetailsSchema.safeParse(guestPayload);
    if (!parsed.success) {
      setFieldProblems(fieldErrors(parsed.error as unknown as ZodErrorLike));
      return;
    }
    const guest = parsed.data;
    setSubmitState({ status: "submitting" });
    setFieldProblems({});

    const effectiveQuote = fresh ?? quote;
    try {
      const res = await fetch("/api/guesty/reservation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          quoteId: activeQuoteId,
          listingId: session.listingId,
          checkIn: session.checkIn,
          checkOut: session.checkOut,
          guests: session.guests,
          expected: {
            total: effectiveQuote.total,
            currency: effectiveQuote.currency,
            fingerprint: effectiveQuote.fingerprint,
          },
          guest: {
            ...guest,
            guestsCount: guest.guestsCount,
          },
        }),
      });

      const body = (await res.json()) as {
        status?: string;
        message?: string;
        reservation?: { reservationId: string };
        quote?: FreshQuote;
      };

      if (res.status === 201 && body.reservation?.reservationId) {
        router.push(`/booking/confirmation/${body.reservation.reservationId}`);
        return;
      }

      if (res.status === 409 && body.status === "quote_changed" && body.quote) {
        setFresh(body.quote);
        setActiveQuoteId(body.quote.quoteId);
        setSubmitState({ status: "quote_changed", quote: body.quote });
        return;
      }

      if (res.status === 402 && body.status === "payment_required") {
        setSubmitState({
          status: "payment_required",
          message: body.message ?? "Payment confirmation is required for this instant booking.",
        });
        return;
      }

      setSubmitState({
        status: "error",
        message: body.message ?? "We couldn't complete the booking. Please try again.",
      });
    } catch {
      setSubmitState({
        status: "error",
        message: "We couldn't reach our booking system. Please try again in a moment.",
      });
    }
  };

  const inputClass = (group: string) =>
    `input-rp ${fieldProblems[group] ? "border-status-danger!" : ""}`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      noValidate
      className="space-y-8"
    >
      <fieldset>
        <legend className="font-display text-xl font-medium text-ink-900">Your details</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-rp" htmlFor="cf-first">First name</label>
            <input
              id="cf-first"
              type="text"
              autoComplete="given-name"
              className={inputClass("firstName")}
              value={values.firstName}
              onChange={setField("firstName")}
            />
            {fieldProblems.firstName && <FieldError message={fieldProblems.firstName} />}
          </div>
          <div>
            <label className="label-rp" htmlFor="cf-last">Last name</label>
            <input
              id="cf-last"
              type="text"
              autoComplete="family-name"
              className={inputClass("lastName")}
              value={values.lastName}
              onChange={setField("lastName")}
            />
            {fieldProblems.lastName && <FieldError message={fieldProblems.lastName} />}
          </div>
          <div>
            <label className="label-rp" htmlFor="cf-email">Email</label>
            <input
              id="cf-email"
              type="email"
              autoComplete="email"
              className={inputClass("email")}
              value={values.email}
              onChange={setField("email")}
              placeholder="you@example.com"
            />
            {fieldProblems.email && <FieldError message={fieldProblems.email} />}
          </div>
          <div>
            <label className="label-rp" htmlFor="cf-phone">Phone</label>
            <input
              id="cf-phone"
              type="tel"
              autoComplete="tel"
              className={inputClass("phone")}
              value={values.phone}
              onChange={setField("phone")}
              placeholder="+44 7…"
            />
            {fieldProblems.phone && <FieldError message={fieldProblems.phone} />}
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-display text-xl font-medium text-ink-900">Where should we reach you?</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-rp" htmlFor="cf-country">Country</label>
            <input
              id="cf-country"
              type="text"
              className={inputClass("country")}
              value={values.country}
              onChange={setField("country")}
            />
            {fieldProblems.country && <FieldError message={fieldProblems.country} />}
          </div>
          <div>
            <label className="label-rp" htmlFor="cf-city">City</label>
            <input
              id="cf-city"
              type="text"
              className={inputClass("city")}
              value={values.city}
              onChange={setField("city")}
            />
            {fieldProblems.city && <FieldError message={fieldProblems.city} />}
          </div>
          <div className="sm:col-span-2">
            <label className="label-rp" htmlFor="cf-address">Address</label>
            <input
              id="cf-address"
              type="text"
              autoComplete="street-address"
              className={inputClass("address")}
              value={values.address}
              onChange={setField("address")}
            />
            {fieldProblems.address && <FieldError message={fieldProblems.address} />}
          </div>
          <div>
            <label className="label-rp" htmlFor="cf-postcode">Postal code</label>
            <input
              id="cf-postcode"
              type="text"
              autoComplete="postal-code"
              className={inputClass("postalCode")}
              value={values.postalCode}
              onChange={setField("postalCode")}
            />
          </div>
          <div>
            <label className="label-rp" htmlFor="cf-guests">Guests</label>
            <input
              id="cf-guests"
              type="number"
              min={1}
              max={40}
              className={inputClass("guestsCount")}
              value={values.guestsCount}
              onChange={setField("guestsCount")}
            />
            {fieldProblems.guestsCount && <FieldError message={fieldProblems.guestsCount} />}
          </div>
          <div className="sm:col-span-2">
            <label className="label-rp" htmlFor="cf-requests">Special requests <span className="font-normal text-ink-400">(optional)</span></label>
            <textarea
              id="cf-requests"
              rows={3}
              className={inputClass("specialRequests")}
              value={values.specialRequests}
              onChange={setField("specialRequests")}
              placeholder="Early check-in, celebration arrangements, accessibility needs…"
            />
            {fieldProblems.specialRequests && <FieldError message={fieldProblems.specialRequests} />}
          </div>
        </div>
      </fieldset>

      <div className="rounded-2xl bg-ivory-200/60 p-5 text-sm leading-relaxed text-ink-600 ring-1 ring-ink-900/10">
        <p className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-status-success" aria-hidden="true" />
          Submit an inquiry for{" "}
          <span className="font-semibold text-ink-900">{propertyTitle}</span> —{" "}
          {formatDateRange(session.checkIn, session.checkOut)},{" "}
          {nightsBetween(session.checkIn, session.checkOut)} night
          {nightsBetween(session.checkIn, session.checkOut) === 1 ? "" : "s"},{" "}
          {session.guests} guest{session.guests === 1 ? "" : "s"}.
        </p>
        <p className="mt-2">
          No payment is taken today. A member of our team will confirm the stay
          directly with you at{" "}
          <span className="font-medium text-ink-900">
            {formatPrice(quote.currency === fresh?.currency ? (fresh?.total ?? quote.total) : quote.total, quote.currency)}
          </span>.
        </p>
      </div>

      {submitState.status === "error" && (
        <StatusBanner tone="danger">{submitState.message}</StatusBanner>
      )}

      {submitState.status === "payment_required" && (
        <div className="space-y-3">
          <StatusBanner tone="info">
            <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
            {submitState.message}
          </StatusBanner>
          <p className="text-sm leading-relaxed text-ink-500">
            This property is listed for instant booking, which needs payment
            confirmation at the point of reservation — that isn&apos;t available
            on this site yet. Please contact us and we&apos;ll arrange your stay.
          </p>
        </div>
      )}

      {submitState.status === "quote_changed" && submitState.quote && (
        <div className="space-y-4 rounded-2xl bg-status-warning/10 p-5 ring-1 ring-status-warning/30">
          <p className="text-sm font-medium text-ink-900">
            The price for your dates has changed. Our booking system now shows:
          </p>
          <ul className="space-y-2 text-sm text-ink-700">
            {(submitState.quote.breakdown ?? []).map((line) => (
              <li key={line.label} className="flex items-baseline justify-between gap-4">
                <span>{line.label}</span>
                <span className="font-medium">{formatPrice(line.amount, line.currency)}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between border-t border-ink-900/10 pt-3">
            <span className="text-sm font-semibold uppercase tracking-wide">Total</span>
            <span className="font-display text-xl font-medium text-ink-900">
              {formatPrice(submitState.quote.total, submitState.quote.currency)}
            </span>
          </div>
          <button type="submit" className="btn-gold btn-lg w-full">
            Confirm at the updated price
          </button>
        </div>
      )}

      {submitState.status !== "quote_changed" && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-400">
            By submitting you agree to our terms and privacy policy.
          </p>
          <button
            type="submit"
            disabled={submitState.status === "submitting"}
            className="btn-gold btn-md min-w-56"
          >
            {submitState.status === "submitting" && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {submitState.status === "submitting" ? "Submitting inquiry…" : "Confirm booking request"}
          </button>
        </div>
      )}
    </form>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="mt-1.5 text-xs font-medium text-status-danger">{message}</p>;
}