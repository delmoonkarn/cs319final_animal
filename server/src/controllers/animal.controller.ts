import type { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import {
  animalDetailInclude,
  animalListSelect,
  toAnimalDetail,
  toAnimalListItem,
  type AnimalListItem,
} from "../lib/animal-dto";
import { HttpError } from "../lib/http-error";
import { prisma } from "../lib/prisma";
import { deleteImages } from "../lib/storage";
import type { Paginated } from "../types/api";
import {
  createAnimalSchema,
  listAnimalsQuerySchema,
  updateAnimalSchema,
  type ListAnimalsQuery,
} from "../validators/animal.validator";
import { idParamSchema } from "../validators/common";

const SORT_ORDERS: Record<ListAnimalsQuery["sort"], Prisma.AnimalOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }, { id: "desc" }],
  oldest: [{ createdAt: "asc" }, { id: "asc" }],
  urgent: [{ isUrgent: "desc" }, { createdAt: "desc" }, { id: "desc" }],
  name: [{ name: "asc" }, { id: "asc" }],
};

/** GET /api/animals — public list with filters, search, sorting and pagination. */
export async function listAnimals(req: Request, res: Response): Promise<void> {
  const query = listAnimalsQuerySchema.parse(req.query);

  const where: Prisma.AnimalWhereInput = {
    species: query.species,
    status: query.status,
    gender: query.gender,
    isUrgent: query.isUrgent,
    isVaccinated: query.isVaccinated,
  };
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { breed: { contains: query.q, mode: "insensitive" } },
      { locationFound: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await prisma.$transaction([
    prisma.animal.findMany({
      where,
      orderBy: SORT_ORDERS[query.sort],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: animalListSelect,
    }),
    prisma.animal.count({ where }),
  ]);

  const body: Paginated<AnimalListItem> = {
    data: rows.map(toAnimalListItem),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
  res.json(body);
}

/** GET /api/animals/:id — public detail with all photos and the success-story timeline. */
export async function getAnimal(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const animal = await prisma.animal.findUnique({ where: { id }, include: animalDetailInclude });
  if (!animal) {
    throw new HttpError(404, "Animal not found");
  }
  res.json(toAnimalDetail(animal));
}

/** POST /api/animals (admin) — new listings start as AVAILABLE. */
export async function createAnimal(req: Request, res: Response): Promise<void> {
  const data = createAnimalSchema.parse(req.body);
  const animal = await prisma.animal.create({ data, include: animalDetailInclude });
  res.status(201).json(toAnimalDetail(animal));
}

/** PATCH /api/animals/:id (admin) — partial update; photos removed from the list are deleted from Storage. */
export async function updateAnimal(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const data = updateAnimalSchema.parse(req.body);

  const existing = await prisma.animal.findUnique({
    where: { id },
    select: { imageUrls: true, report: { select: { imageUrls: true } } },
  });
  if (!existing) {
    throw new HttpError(404, "Animal not found");
  }

  const animal = await prisma.animal.update({ where: { id }, data, include: animalDetailInclude });

  if (data.imageUrls) {
    // Keep photos still listed, and photos the original report (if any) still shows.
    const kept = new Set([...data.imageUrls, ...(existing.report?.imageUrls ?? [])]);
    await deleteImages(existing.imageUrls.filter((url) => !kept.has(url)));
  }

  res.json(toAnimalDetail(animal));
}

/**
 * DELETE /api/animals/:id (admin) — also removes its adoption requests, favorites and updates
 * (database cascade) and their photos in Storage. A linked report is kept but unlinked.
 */
export async function deleteAnimal(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);

  const existing = await prisma.animal.findUnique({
    where: { id },
    select: {
      imageUrls: true,
      updates: { select: { imageUrls: true } },
      report: { select: { imageUrls: true } },
    },
  });
  if (!existing) {
    throw new HttpError(404, "Animal not found");
  }

  await prisma.animal.delete({ where: { id } });

  // The original report is kept, so its photos (shared with the animal) stay too.
  const keptForReport = new Set(existing.report?.imageUrls ?? []);
  await deleteImages(
    [...existing.imageUrls, ...existing.updates.flatMap((update) => update.imageUrls)].filter(
      (url) => !keptForReport.has(url),
    ),
  );

  res.status(204).end();
}
