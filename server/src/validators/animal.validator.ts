import { AnimalStatus, Gender, Species } from "@prisma/client";
import { z } from "zod";
import { bodySchema, textField } from "./common";

export const MAX_ANIMAL_IMAGES = 5;

const speciesField = z.enum(Species, { error: "Species must be DOG, CAT or OTHER" });
const genderField = z.enum(Gender, { error: "Gender must be MALE, FEMALE or UNKNOWN" });
const statusField = z.enum(AnimalStatus, { error: "Status must be AVAILABLE, PENDING or ADOPTED" });

const booleanField = (label: string) => z.boolean({ error: `${label} must be true or false` });

const imageUrlsField = z
  .array(z.url({ protocol: /^https?$/, error: "Each image must be a valid http(s) URL" }), {
    error: "imageUrls must be an array of image URLs",
  })
  .min(1, "Add at least 1 image")
  .max(MAX_ANIMAL_IMAGES, `Add at most ${MAX_ANIMAL_IMAGES} images`)
  .refine((urls) => new Set(urls).size === urls.length, { error: "The same image is listed twice" });

/** Fields an admin can set. `status` / `adoptedAt` are not here: adoption requests drive them. */
const animalFields = {
  name: textField("Name", 60),
  species: speciesField,
  breed: textField("Breed", 60),
  gender: genderField,
  ageMonths: z
    .number({ error: "ageMonths must be a number" })
    .int("ageMonths must be a whole number")
    .min(0, "ageMonths can't be negative")
    .max(360, "ageMonths must be at most 360"),
  personality: textField("Personality", 1000),
  healthNote: textField("Health note", 1000),
  isVaccinated: booleanField("isVaccinated"),
  isUrgent: booleanField("isUrgent"),
  /** 1–5 URLs from POST /api/uploads; the first one is the cover photo */
  imageUrls: imageUrlsField,
  locationFound: textField("Location found", 200),
};

/** POST /api/animals — new animals always start as AVAILABLE. */
export const createAnimalSchema = bodySchema({
  ...animalFields,
  isVaccinated: animalFields.isVaccinated.optional(),
  isUrgent: animalFields.isUrgent.optional(),
});

/** PATCH /api/animals/:id — any subset of the fields. */
export const updateAnimalSchema = bodySchema(animalFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, { error: "Send at least one field to update" });

export const ANIMAL_SORTS = ["newest", "oldest", "urgent", "name"] as const;

const optionalBooleanQuery = (label: string) =>
  z.stringbool({ error: `${label} must be true or false` }).optional();

/** GET /api/animals?species=&status=&gender=&isUrgent=&isVaccinated=&q=&sort=&page=&pageSize= */
export const listAnimalsQuerySchema = z.object({
  species: speciesField.optional(),
  status: statusField.optional(),
  gender: genderField.optional(),
  isUrgent: optionalBooleanQuery("isUrgent"),
  isVaccinated: optionalBooleanQuery("isVaccinated"),
  /** Search in name, breed and location */
  q: z.string({ error: "q must be text" }).trim().max(100, "q must be at most 100 characters").optional(),
  sort: z.enum(ANIMAL_SORTS, { error: `sort must be one of: ${ANIMAL_SORTS.join(", ")}` }).default("newest"),
  page: z.coerce.number({ error: "page must be a number" }).int("page must be a whole number").min(1, "page must be at least 1").default(1),
  pageSize: z.coerce
    .number({ error: "pageSize must be a number" })
    .int("pageSize must be a whole number")
    .min(1, "pageSize must be at least 1")
    .max(50, "pageSize must be at most 50")
    .default(12),
});

export type CreateAnimalInput = z.infer<typeof createAnimalSchema>;
export type UpdateAnimalInput = z.infer<typeof updateAnimalSchema>;
export type ListAnimalsQuery = z.infer<typeof listAnimalsQuerySchema>;
