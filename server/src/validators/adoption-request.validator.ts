import { HousingType, ReviewStatus } from "@prisma/client";
import { z } from "zod";
import { bodySchema, idFromUrl, idInBody, paginationQuery, textField } from "./common";

const statusField = z.enum(ReviewStatus, { error: "status must be PENDING, APPROVED or REJECTED" });

/** POST /api/adoption-requests */
export const createAdoptionRequestSchema = bodySchema({
  animalId: idInBody("animalId"),
  reason: textField("Reason", 1000),
  housingType: z.enum(HousingType, { error: "housingType must be HOUSE, CONDO or DORM" }),
});

/** PATCH /api/adoption-requests/:id (admin) — the decision on a pending request. */
export const reviewAdoptionRequestSchema = bodySchema({
  status: z.enum([ReviewStatus.APPROVED, ReviewStatus.REJECTED], {
    error: "status must be APPROVED or REJECTED",
  }),
});

/** GET /api/adoption-requests/me?status= */
export const myAdoptionRequestsQuerySchema = z.object({
  status: statusField.optional(),
});

/** GET /api/adoption-requests?status=&animalId=&page=&pageSize= (admin) */
export const listAdoptionRequestsQuerySchema = z.object({
  status: statusField.optional(),
  animalId: idFromUrl("animalId").optional(),
  ...paginationQuery,
});
