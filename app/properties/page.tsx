import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PropertiesFilters, { type FilterValues } from "@/components/PropertiesFilters";
import PropertyCard from "@/components/PropertyCard";
import { searchAvailableProperties } from "@/lib/guesty/availability";
import { searchParamsSchema } from "@/lib/validators";
import { createMetadata } from "@/lib/site";
import { pluralize } from "@/lib/utils/format";

export const metadata: Metadata = createMetadata({
  title: "Properties",
  description:
    "Browse our portfolio of handpicked luxury stays across the United Kingdom with live availability.",
  path: "/properties",
});

export const dynamic = "force-dynamic";

interface SearchParams {
  [key: string]: string | string[] | undefined;
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const rawParams = await searchParams;
  const single = (key: string): string | undefined => {
    const value = rawParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const query = {
    location: single("location"),
    checkIn: single("checkIn"),
    checkOut: single("checkOut"),
    guests: single("guests"),
    bedrooms: single("bedrooms"),
    propertyType: single("propertyType"),
    minPrice: single("minPrice"),
    maxPrice: single("maxPrice"),
    currency: single("currency"),
  };

  const parsed = searchParamsSchema.safeParse(query);
  if (!parsed.success) {
    redirect("/properties");
  }

  const filters = parsed.data;
  const { matches, availabilityChecked } = await searchAvailableProperties(filters);

  const filterValues: FilterValues = {
    location: filters.location ?? "",
    checkIn: filters.checkIn,
    checkOut: filters.checkOut,
    guests: filters.guests ?? 2,
    bedrooms: filters.bedrooms?.toString() ?? "",
    propertyType: filters.propertyType ?? "",
    minPrice: filters.minPrice?.toString() ?? "",
    maxPrice: filters.maxPrice?.toString() ?? "",
  };

  const headingDefault = "All properties";

  return (
    <div className="pt-16 sm:pt-20">
      <section className="bg-ivory-100">
        <div className="container-rp pb-10 pt-14 sm:pb-14 sm:pt-20">
          <p className="eyebrow mb-3">Explore</p>
          <h1 className="display-1">Luxury stays in the UK</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-500 sm:text-lg">
            Every property below reflects live availability from our booking
            system — search by destination, dates and guest count for the most
            current results.
          </p>
        </div>
      </section>

      <section className="container-rp py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PropertiesFilters initial={filterValues} />
          <p className="text-sm text-ink-500">
            <span className="font-semibold text-ink-900">{matches.length}</span>{" "}
            {matches.length === 1 ? "property" : "properties"}
            {availabilityChecked && (
              <span className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-status-success/10 px-2.5 py-1 text-xs text-status-success">
                available for your dates
              </span>
            )}
          </p>
        </div>

        <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((property, i) => (
            <PropertyCard key={property.id} property={property} priority={i < 3} />
          ))}
        </div>

        {matches.length === 0 && (
          <div className="card-rp mt-10 space-y-3 p-12 text-center">
            <p className="font-display text-xl font-medium text-ink-900">
              No homes match your search
            </p>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-ink-500">
              {availabilityChecked
                ? "Try different dates, a wider date range, or clear your filters to see all available homes."
                : "Try adjusting your destination or guest count to see more results."}
            </p>
            <p className="pt-1 text-sm text-ink-600">
              Searching for: <span className="font-semibold">{headingDefault}</span>
              {filterValues.location && <> · {filterValues.location}</>}
              {filterValues.checkIn && ` · ${filterValues.checkIn} → ${filterValues.checkOut}`}
              {filterValues.guests > 0 && ` · ${filterValues.guests} ${pluralize(filterValues.guests, "guest", "guests")}`}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}