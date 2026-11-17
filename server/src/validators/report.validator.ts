import { ReviewStatus } from "@prisma/client";
import { z } from "zod";
import { animalFields, speciesField } from "./animal.validator";
import { bodySchema, imageUrlsField, optionalTextField, paginationQuery, textField } from "./common";

export const MAX_REPORT_IMAGES = 3;

/** POST /api/reports */
export const createReportSchema = bodySchema({
  species: speciesField,
  /** Optional: the reporter may not know the breed */
  breed: optionalTextField("Breed", 60),
  imageUrls: imageUrlsField(1, MAX_REPORT_IMAGES),
  location: textField("Location", 200),
  description: textField("Description", 1000),
});

/**
 * Details for the animal listing created when a report is approved. Species, photos and location
 * come from the report unless given here; breed is required only when the report has none.
 */
const approvedAnimalSchema = z.object(
  {
    name: animalFields.name,
    gender: animalFields.gender,
    ageMonths: animalFields.ageMonths,
    personality: animalFields.personality,
    description: animalFields.description,
    healthNote: animalFields.healthNote,
    province: animalFields.province,
    breed: animalFields.breed.optional(),
    isVaccinated: animalFields.isVaccinated.optional(),
    isSterilized: animalFields.isSterilized.optional(),
    isUrgent: animalFields.isUrgent.optional(),
    locationFound: animalFields.locationFound.optional(),
    imageUrls: animalFields.imageUrls.optional(),
  },
  { error: "animal must be an object with the new animal's details" },
);

/** PATCH /api/reports/:id (admin) */
export const reviewReportSchema = z.discriminatedUnion(
  "status",
  [
    z.object({ status: z.literal(ReviewStatus.REJECTED) }),
    z.object({ status: z.literal(ReviewStatus.APPROVED), animal: approvedAnimalSchema }),
  ],
  { error: 'status must be "APPROVED" (with animal details) or "REJECTED"' },
);

const statusField = z.enum(ReviewStatus, { error: "status must be PENDING, APPROVED or REJECTED" });

/** GET /api/reports?status=&species=&page=&pageSize= (admin) */
export const listReportsQuerySchema = z.object({
  status: statusField.optional(),
  species: speciesField.optional(),
  ...paginationQuery,
});
