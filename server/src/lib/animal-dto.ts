import type { Prisma } from "@prisma/client";
import type { ImageDto } from "../types/api";
import { toThumbUrl } from "./storage";

/** Response shapes for the animal routes, and the Prisma queries that produce them. */

export function toImageDto(url: string): ImageDto {
  return { url, thumbUrl: toThumbUrl(url) };
}

// ─────────────── List item (cards on the list page) ───────────────

export const animalListSelect = {
  id: true,
  name: true,
  species: true,
  breed: true,
  gender: true,
  ageMonths: true,
  personality: true,
  isVaccinated: true,
  isSterilized: true,
  isUrgent: true,
  status: true,
  locationFound: true,
  province: true,
  imageUrls: true,
  adoptedAt: true,
  createdAt: true,
} as const satisfies Prisma.AnimalSelect;

type AnimalListRow = Prisma.AnimalGetPayload<{ select: typeof animalListSelect }>;

export type AnimalListItem = Omit<AnimalListRow, "imageUrls"> & {
  /** First image (cover photo) */
  coverImage: ImageDto | null;
};

export function toAnimalListItem({ imageUrls, ...animal }: AnimalListRow): AnimalListItem {
  return { ...animal, coverImage: imageUrls.length > 0 ? toImageDto(imageUrls[0]) : null };
}

// ─────────────── Detail (the /animals/:id page) ───────────────

export const animalDetailInclude = {
  updates: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      caption: true,
      imageUrls: true,
      createdAt: true,
      author: { select: { id: true, name: true, role: true } },
    },
  },
  _count: { select: { favorites: true, adoptionRequests: true } },
} as const satisfies Prisma.AnimalInclude;

type AnimalDetailRow = Prisma.AnimalGetPayload<{ include: typeof animalDetailInclude }>;
type AnimalUpdateRow = AnimalDetailRow["updates"][number];

/** One success-story entry on an adopted animal's timeline. */
export type AnimalUpdateDto = Omit<AnimalUpdateRow, "imageUrls"> & { images: ImageDto[] };

export type AnimalDetail = Omit<AnimalDetailRow, "imageUrls" | "updates" | "_count"> & {
  /** All photos in order; the first is the cover */
  images: ImageDto[];
  favoriteCount: number;
  /** How many people have sent an adoption request for this animal (any status) */
  requestCount: number;
  /** Success-story timeline, oldest first (empty unless adopted) */
  updates: AnimalUpdateDto[];
};

export function toAnimalDetail({ imageUrls, updates, _count, ...animal }: AnimalDetailRow): AnimalDetail {
  return {
    ...animal,
    images: imageUrls.map(toImageDto),
    favoriteCount: _count.favorites,
    requestCount: _count.adoptionRequests,
    updates: updates.map(({ imageUrls: updateImages, ...update }) => ({
      ...update,
      images: updateImages.map(toImageDto),
    })),
  };
}
