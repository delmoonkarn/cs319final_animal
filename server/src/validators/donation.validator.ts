import { DonationStatus } from "@prisma/client";
import { z } from "zod";
import { bodySchema, idInBody, paginationQuery, textField, urlField } from "./common";

// ─────────────── Packages ───────────────

const packageFields = {
  name: textField("Name", 100),
  description: textField("Description", 500),
  /** Price in THB */
  price: z
    .number({ error: "price must be a number" })
    .int("price must be a whole number of baht")
    .min(1, "price must be at least 1 baht")
    .max(1_000_000, "price must be at most 1,000,000 baht"),
  /** An emoji or icon name, e.g. "🍖" */
  icon: textField("Icon", 50),
};

/** POST /api/donation-packages (admin) */
export const createPackageSchema = bodySchema(packageFields);

/** PATCH /api/donation-packages/:id (admin) */
export const updatePackageSchema = bodySchema(packageFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, { error: "Send at least one field to update" });

// ─────────────── Donations ───────────────

export const MAX_DONATION_LINES = 20;

const donationItemSchema = z.object(
  {
    packageId: idInBody("packageId"),
    quantity: z
      .number({ error: "quantity must be a number" })
      .int("quantity must be a whole number")
      .min(1, "quantity must be at least 1")
      .max(99, "quantity must be at most 99"),
  },
  { error: "Each item must be { packageId, quantity }" },
);

/** POST /api/donations — prices and the total are calculated by the server. */
export const createDonationSchema = bodySchema({
  items: z
    .array(donationItemSchema, { error: "items must be a list of { packageId, quantity }" })
    .min(1, "Choose at least one package")
    .max(MAX_DONATION_LINES, `At most ${MAX_DONATION_LINES} different packages`)
    .refine((items) => new Set(items.map((item) => item.packageId)).size === items.length, {
      error: "Each package can appear only once (use quantity instead)",
    }),
  /** Payment slip photo, uploaded through POST /api/uploads */
  slipUrl: urlField("slipUrl"),
});

const statusField = z.enum(DonationStatus, { error: "status must be PENDING or CONFIRMED" });

/** PATCH /api/donations/:id (admin) */
export const reviewDonationSchema = bodySchema({ status: statusField });

/** GET /api/donations?status=&page=&pageSize= (admin) */
export const listDonationsQuerySchema = z.object({
  status: statusField.optional(),
  ...paginationQuery,
});
