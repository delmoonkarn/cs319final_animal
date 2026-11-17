import type { Prisma } from "@prisma/client";
import type { ImageDto } from "../types/api";
import { animalListSelect, toAnimalListItem, toImageDto, type AnimalListItem } from "./animal-dto";

/** Response shape for success-story updates (feed and create/edit), and the query behind it. */

export const animalUpdateSelect = {
  id: true,
  caption: true,
  imageUrls: true,
  createdAt: true,
  author: { select: { id: true, name: true, role: true } },
  animal: { select: animalListSelect },
} as const satisfies Prisma.AnimalUpdateSelect;

type AnimalUpdateRow = Prisma.AnimalUpdateGetPayload<{ select: typeof animalUpdateSelect }>;

export type AnimalUpdateItem = Omit<AnimalUpdateRow, "imageUrls" | "animal"> & {
  images: ImageDto[];
  animal: AnimalListItem;
};

export function toAnimalUpdateItem({ imageUrls, animal, ...update }: AnimalUpdateRow): AnimalUpdateItem {
  return { ...update, images: imageUrls.map(toImageDto), animal: toAnimalListItem(animal) };
}
