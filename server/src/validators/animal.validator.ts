import { AnimalStatus, Gender, Species } from "@prisma/client";
import { z } from "zod";
import { THAI_PROVINCES } from "../lib/provinces";
import { bodySchema, imageUrlsField, paginationQuery, textField } from "./common";

export const MAX_ANIMAL_IMAGES = 5;
export const MAX_PERSONALITY_TAGS = 8;

export const speciesField = z.enum(Species, { error: "Species must be DOG, CAT or OTHER" });
const genderField = z.enum(Gender, { error: "Gender must be MALE, FEMALE or UNKNOWN" });
/** AVAILABLE or ADOPTED. An admin sets ADOPTED by hand for adoptions arranged offline. */
const statusField = z.enum(AnimalStatus, { error: "status must be AVAILABLE or ADOPTED" });
export const provinceField = z.enum(THAI_PROVINCES, {
  error: "province must be one of the 77 Thai provinces (see GET /api/provinces)",
});

const booleanField = (label: string) => z.boolean({ error: `${label} must be true or false` });

const personalityField = z
  .array(textField("Personality tag", 40), { error: "personality must be a list of tags, e.g. [\"ขี้อ้อน\"]" })
  .min(1, "Add at least 1 personality tag")
  .max(MAX_PERSONALITY_TAGS, `Add at most ${MAX_PERSONALITY_TAGS} personality tags`)
  .refine((tags) => new Set(tags).size === tags.length, { error: "The same personality tag is listed twice" });

/** Fields an admin can set when creating or editing an animal. */
export const animalFields = {
  name: textField("Name", 60),
  species: speciesField,
  breed: textField("Breed", 60),
  gender: genderField,
  ageMonths: z
    .number({ error: "ageMonths must be a number" })
    .int("ageMonths must be a whole number")
    .min(0, "ageMonths can't be negative")
    .max(360, "ageMonths must be at most 360"),
  /** Tags such as ["ขี้อ้อน", "ชอบเดินเล่น"] */
  personality: personalityField,
  description: textField("Description", 2000),
  /** Health history, one entry per line */
  healthNote: textField("Health note", 2000),
  isVaccinated: booleanField("isVaccinated"),
  isSterilized: booleanField("isSterilized"),
  isUrgent: booleanField("isUrgent"),
  /** 1–5 URLs from POST /api/uploads; the first one is the cover photo */
  imageUrls: imageUrlsField(1, MAX_ANIMAL_IMAGES),
  locationFound: textField("Location found", 200),
  province: provinceField,
  status: statusField,
};

/** POST /api/animals — status defaults to AVAILABLE. */
export const createAnimalSchema = bodySchema({
  ...animalFields,
  isVaccinated: animalFields.isVaccinated.optional(),
  isSterilized: animalFields.isSterilized.optional(),
  isUrgent: animalFields.isUrgent.optional(),
  status: animalFields.status.optional(),
});

/** PATCH /api/animals/:id — any subset of the fields. */
export const updateAnimalSchema = bodySchema(animalFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, { error: "Send at least one field to update" });

export const ANIMAL_SORTS = ["newest", "oldest", "urgent", "name"] as const;

const optionalBooleanQuery = (label: string) =>
  z.stringbool({ error: `${label} must be true or false` }).optional();

/** GET /api/animals?species=&status=&gender=&province=&isUrgent=&isVaccinated=&isSterilized=&q=&sort=&page=&pageSize= */
export const listAnimalsQuerySchema = z.object({
  species: speciesField.optional(),
  status: statusField.optional(),
  gender: genderField.optional(),
  province: provinceField.optional(),
  isUrgent: optionalBooleanQuery("isUrgent"),
  isVaccinated: optionalBooleanQuery("isVaccinated"),
  isSterilized: optionalBooleanQuery("isSterilized"),
  /** Search in name, breed, description, location and province */
  q: z.string({ error: "q must be text" }).trim().max(100, "q must be at most 100 characters").optional(),
  sort: z.enum(ANIMAL_SORTS, { error: `sort must be one of: ${ANIMAL_SORTS.join(", ")}` }).default("newest"),
  ...paginationQuery,
});

export type CreateAnimalInput = z.infer<typeof createAnimalSchema>;
export type UpdateAnimalInput = z.infer<typeof updateAnimalSchema>;
export type ListAnimalsQuery = z.infer<typeof listAnimalsQuerySchema>;
