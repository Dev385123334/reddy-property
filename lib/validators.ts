import { z } from "zod";
import { isValidDateString } from "@/lib/utils/dates";

const MAX_GUESTS = 40;

export const dateStringSchema = z.string().refine(isValidDateString, {
  message: "Dates must use YYYY-MM-DD format.",
});

/** Search query params for /properties and /api/guesty/search. */
export const searchParamsSchema = z.object({
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guests: z.coerce.number().int().min(1).max(MAX_GUESTS).optional(),
  location: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .optional(),
  bedrooms: z.coerce.number().int().min(0).max(30).optional(),
  propertyType: z.string().trim().max(60).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  currency: z.string().length(3).optional(),
}).superRefine((data, ctx) => {
  if ((data.minPrice ?? 0) > (data.maxPrice ?? Number.MAX_SAFE_INTEGER)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["minPrice"],
      message: "Minimum price must be below the maximum price.",
    });
  }
  if (data.checkIn && data.checkOut && data.checkIn >= data.checkOut) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["checkOut"],
      message: "Check-out must be after check-in.",
    });
  }
});

export const listingIdSchema = z.string().min(1).max(64);

export const dateRangeSchema = z
  .object({
    listingId: listingIdSchema,
    checkIn: dateStringSchema,
    checkOut: dateStringSchema,
    guests: z.coerce.number().int().min(1).max(MAX_GUESTS),
  })
  .superRefine((data, ctx) => {
    if (data.checkIn >= data.checkOut) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["checkOut"],
        message: "Check-out must be after check-in.",
      });
    }
  });

export const quoteRequestSchema = dateRangeSchema.extend({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  email: z.string().email().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
});

const phoneSchema = z
  .string()
  .trim()
  .min(6)
  .max(24)
  .regex(/^[+()\-\d.\s]+$/, "Enter a valid phone number");

export const guestDetailsSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  email: z.string().email("Enter a valid email address").max(200),
  phone: phoneSchema,
  country: z.string().trim().min(1, "Country is required").max(80),
  city: z.string().trim().min(1, "City is required").max(120),
  address: z.string().trim().min(1, "Address is required").max(240),
  postalCode: z.string().trim().max(24).optional().or(z.literal("")),
  guestsCount: z.coerce.number().int().min(1).max(MAX_GUESTS),
  specialRequests: z.string().trim().max(1000).optional().or(z.literal("")),
});

/** Final reservation request. Includes the displayed quote for revalidation. */
export const reservationRequestSchema = z.object({
  sessionId: z.string().min(8).max(200),
  quoteId: z.string().min(1).max(120),
  listingId: listingIdSchema,
  checkIn: dateStringSchema,
  checkOut: dateStringSchema,
  guests: z.coerce.number().int().min(1).max(MAX_GUESTS),
  expected: z.object({
    total: z.coerce.number().finite().nonnegative(),
    currency: z.string().length(3),
    fingerprint: z.string().min(8).max(64),
  }),
  guest: guestDetailsSchema,
});

export const webhookEventSchema = z.object({
  _id: z.union([z.string(), z.number()]).optional(),
  id: z.union([z.string(), z.number()]).optional(),
  eventType: z.string().optional(),
  type: z.string().optional(),
  event: z.string().optional(),
  listingId: z.string().optional(),
  reservationId: z.string().optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
}).passthrough();