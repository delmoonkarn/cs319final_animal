import type { Prisma } from "@prisma/client";
import { animalListSelect, toAnimalListItem, type AnimalListItem } from "./animal-dto";

/** Response shapes for adoption requests, and the queries that produce them. */

/** What the applicant sees: their request + a summary of the animal. */
export const myAdoptionRequestSelect = {
  id: true,
  reason: true,
  housingType: true,
  status: true,
  createdAt: true,
  animal: { select: animalListSelect },
} as const satisfies Prisma.AdoptionRequestSelect;

/** What the admin sees: the same plus the applicant's contact details. */
export const adminAdoptionRequestSelect = {
  ...myAdoptionRequestSelect,
  user: { select: { id: true, name: true, email: true, phone: true } },
} as const satisfies Prisma.AdoptionRequestSelect;

type MyAdoptionRequestRow = Prisma.AdoptionRequestGetPayload<{ select: typeof myAdoptionRequestSelect }>;
type AdminAdoptionRequestRow = Prisma.AdoptionRequestGetPayload<{ select: typeof adminAdoptionRequestSelect }>;

export type MyAdoptionRequest = Omit<MyAdoptionRequestRow, "animal"> & { animal: AnimalListItem };
export type AdminAdoptionRequest = Omit<AdminAdoptionRequestRow, "animal"> & { animal: AnimalListItem };

export function toMyAdoptionRequest({ animal, ...request }: MyAdoptionRequestRow): MyAdoptionRequest {
  return { ...request, animal: toAnimalListItem(animal) };
}

export function toAdminAdoptionRequest({ animal, ...request }: AdminAdoptionRequestRow): AdminAdoptionRequest {
  return { ...request, animal: toAnimalListItem(animal) };
}
