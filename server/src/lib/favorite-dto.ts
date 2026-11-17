import type { Prisma } from "@prisma/client";
import { animalListSelect, toAnimalListItem, type AnimalListItem } from "./animal-dto";

/** Response shape for the wishlist, and the query that produces it. */

export const favoriteSelect = {
  animalId: true,
  createdAt: true,
  animal: { select: animalListSelect },
} as const satisfies Prisma.FavoriteSelect;

type FavoriteRow = Prisma.FavoriteGetPayload<{ select: typeof favoriteSelect }>;

/** One wishlist entry: when it was added + the animal summary. */
export type FavoriteDto = Omit<FavoriteRow, "animal"> & { animal: AnimalListItem };

export function toFavoriteDto({ animal, ...favorite }: FavoriteRow): FavoriteDto {
  return { ...favorite, animal: toAnimalListItem(animal) };
}
