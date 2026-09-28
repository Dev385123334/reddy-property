"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PropertyImage } from "@/lib/guesty/types";

/**
 * Premium image gallery: large stage + thumbnail strip.
 * Keyboard accessible (button controls), no horizontal overflow.
 */
export default function PropertyGallery({ images }: { images: PropertyImage[] }) {
  const [active, setActive] = useState(0);

  const list = images.length > 0 ? images : [];
  if (list.length === 0) {
    return (
      <div className="aspect-[3/2] w-full rounded-2xl bg-gradient-to-br from-ivory-200 to-sand-100" />
    );
  }

  const current = list[Math.min(active, list.length - 1)];

  const prev = () => setActive((i) => (i - 1 + list.length) % list.length);
  const next = () => setActive((i) => (i + 1) % list.length);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[3/2] overflow-hidden rounded-2xl shadow-lift ring-1 ring-ink-900/5">
        <Image
          src={current.url}
          alt={current.caption ?? `Property photo ${active + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-ink-900/5" />

        {current.caption && (
          <p className="absolute bottom-4 left-4 rounded-full bg-ink-900/55 px-3.5 py-1.5 text-xs text-ivory-50 backdrop-blur">
            {current.caption}
          </p>
        )}

        {list.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-ivory-50/90 p-2.5 shadow-soft backdrop-blur transition hover:bg-ivory-50"
            >
              <ChevronLeft className="h-5 w-5 text-ink-900" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next photo"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-ivory-50/90 p-2.5 shadow-soft backdrop-blur transition hover:bg-ivory-50"
            >
              <ChevronRight className="h-5 w-5 text-ink-900" />
            </button>
            <span className="absolute bottom-4 right-4 rounded-full bg-ink-900/55 px-3 py-1 text-xs text-ivory-50 backdrop-blur">
              {active + 1} / {list.length}
            </span>
          </>
        )}
      </div>

      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Gallery thumbnails">
          {list.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => setActive(i)}
              role="tab"
              aria-selected={i === active}
              aria-label={`Show photo ${i + 1}`}
              className={`relative h-20 w-24 shrink-0 overflow-hidden rounded-xl ring-offset-2 transition ${
                i === active
                  ? "ring-2 ring-gold-500"
                  : "opacity-70 hover:opacity-100 ring-1 ring-ink-900/10"
              }`}
            >
              <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}