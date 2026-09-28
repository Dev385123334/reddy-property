import { Quote as QuoteIcon, Star } from "lucide-react";

interface TestimonialProps {
  quote: string;
  name: string;
  location: string;
  rating?: number;
}

export default function TestimonialCard({
  quote,
  name,
  location,
  rating = 5,
}: TestimonialProps) {
  return (
    <figure className="card-rp group relative flex h-full flex-col border-t-2 border-gold-500/40 p-8 transition-all duration-500 ease-lux hover:-translate-y-0.5 hover:shadow-lift">
      <QuoteIcon
        className="absolute right-6 top-6 h-9 w-9 text-gold-500/15"
        aria-hidden="true"
      />
      <div
        className="flex items-center gap-1"
        role="img"
        aria-label={`${rating} out of 5 stars`}
      >
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-gold-500 text-gold-500" aria-hidden="true" />
        ))}
      </div>
      <blockquote className="mt-5 flex-1 font-display text-lg font-medium leading-relaxed text-ink-900">
        “{quote}”
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-ink-900/10 pt-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500/12 font-display text-sm font-medium text-gold-700">
          {name.charAt(0)}
        </span>
        <div>
          <p className="text-sm font-semibold text-ink-900">{name}</p>
          <p className="text-xs text-ink-500">{location}</p>
        </div>
      </figcaption>
    </figure>
  );
}