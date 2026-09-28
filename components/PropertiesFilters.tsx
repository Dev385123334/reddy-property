"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MapPin, SlidersHorizontal, X } from "lucide-react";
import DateRangePicker from "@/components/DateRangePicker";
import GuestsStepper from "@/components/GuestsStepper";

export interface FilterValues {
  location: string;
  checkIn?: string;
  checkOut?: string;
  guests: number;
  bedrooms?: string;
  propertyType?: string;
  minPrice?: string;
  maxPrice?: string;
}

const PROPERTY_TYPES = [
  "Apartment",
  "House",
  "Villa",
  "Cottage",
  "Chalet",
  "Country house",
  "Lodge",
  "Studio",
  "Boat",
] as const;

export default function PropertiesFilters({ initial }: { initial: FilterValues }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<FilterValues>(initial);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    navigate(values, router);
  };

  const reset = () => {
    const cleared: FilterValues = {
      location: "",
      guests: 2,
      bedrooms: "",
      propertyType: "",
      minPrice: "",
      maxPrice: "",
      checkIn: undefined,
      checkOut: undefined,
    };
    setValues(cleared);
    router.replace("/properties");
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="btn-outline btn-md"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Filters
        {hasActiveFilters(initial) && <span className="ml-1 h-2 w-2 rounded-full bg-gold-500" />}
      </button>

      {open && (
        <form
          onSubmit={submit}
          className="animate-rdp-fade-up mt-4 rounded-2xl bg-white p-6 shadow-lift ring-1 ring-ink-900/10"
        >
          <div className="flex items-center justify-between">
            <p className="font-display text-lg font-medium text-ink-900">Refine your stay</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close filters"
              className="rounded-full p-2 text-ink-500 transition hover:bg-ivory-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="label-rp">Destination</label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-500" aria-hidden="true" />
                <input
                  type="text"
                  value={values.location}
                  onChange={(e) => setValues((v) => ({ ...v, location: e.target.value }))}
                  placeholder="City, region or neighbourhood"
                  className="input-rp pl-10"
                />
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <span className="label-rp">Stay dates</span>
              <DateRangePicker
                value={{ checkIn: values.checkIn, checkOut: values.checkOut }}
                onChange={(range) => setValues((v) => ({ ...v, ...range }))}
              />
            </div>

            <div>
              <span className="label-rp">Guests</span>
              <GuestsStepper
                value={values.guests}
                onChange={(guests) => setValues((v) => ({ ...v, guests }))}
                max={40}
              />
            </div>

            <div>
              <label className="label-rp" htmlFor="f-bedrooms">Minimum bedrooms</label>
              <select
                id="f-bedrooms"
                className="input-rp"
                value={values.bedrooms ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, bedrooms: e.target.value }))}
              >
                <option value="">Any</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}+
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-rp" htmlFor="f-type">Property type</label>
              <select
                id="f-type"
                className="input-rp"
                value={values.propertyType ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, propertyType: e.target.value }))}
              >
                <option value="">Any</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-rp" htmlFor="f-minprice">Min price</label>
                <input
                  id="f-minprice"
                  type="number"
                  min={0}
                  step={10}
                  value={values.minPrice ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, minPrice: e.target.value }))}
                  placeholder="£"
                  className="input-rp"
                />
              </div>
              <div>
                <label className="label-rp" htmlFor="f-maxprice">Max price</label>
                <input
                  id="f-maxprice"
                  type="number"
                  min={0}
                  step={10}
                  value={values.maxPrice ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, maxPrice: e.target.value }))}
                  placeholder="£"
                  className="input-rp"
                />
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-end gap-3 border-t border-ink-900/10 pt-5">
            <button type="button" onClick={reset} className="btn-ghost btn-md">
              Reset
            </button>
            <button type="submit" className="btn-gold btn-md">
              Apply filters
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function hasActiveFilters(values: FilterValues): boolean {
  return Boolean(
    values.location ||
      values.checkIn ||
      values.checkOut ||
      values.bedrooms ||
      values.propertyType ||
      values.minPrice ||
      values.maxPrice
  );
}

function navigate(values: FilterValues, router: ReturnType<typeof useRouter>) {
  const params = new URLSearchParams();
  if (values.location.trim()) params.set("location", values.location.trim());
  if (values.checkIn) params.set("checkIn", values.checkIn);
  if (values.checkOut) params.set("checkOut", values.checkOut);
  if (values.guests > 0) params.set("guests", String(values.guests));
  if (values.bedrooms) params.set("bedrooms", values.bedrooms);
  if (values.propertyType) params.set("propertyType", values.propertyType);
  if (values.minPrice) params.set("minPrice", values.minPrice);
  if (values.maxPrice) params.set("maxPrice", values.maxPrice);
  const qs = params.toString();
  router.replace(qs ? `/properties?${qs}` : "/properties");
}