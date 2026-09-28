"use client";

import { CalendarCheck } from "lucide-react";

/**
 * Mobile sticky "Book now" bar — scrolls to the booking card.
 */
export default function BookingStickyBar() {
  const scrollToBooking = () => {
    document.getElementById("booking-card")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-900/10 bg-ivory-100/90 px-5 py-3 backdrop-blur-md lg:hidden">
      <button
        type="button"
        onClick={scrollToBooking}
        className="btn-gold btn-lg w-full"
      >
        <CalendarCheck className="h-4 w-4" aria-hidden="true" />
        Check availability &amp; price
      </button>
    </div>
  );
}