import { AnimalStatus, ReviewStatus, type Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import {
  animalDetailInclude,
  animalListSelect,
  toAnimalDetail,
  toAnimalListItem,
  type AnimalListItem,
} from "../lib/animal-dto";
import { TRANSACTION_OPTIONS, lockAnimal, rejectPendingRequests } from "../lib/animal-status";
import { HttpError } from "../lib/http-error";
import { prisma } from "../lib/prisma";
import { deleteUnusedImages } from "../lib/image-cleanup";
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
    province: query.province,
    isUrgent: query.isUrgent,
    isVaccinated: query.isVaccinated,
    isSterilized: query.isSterilized,
  };
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { breed: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
      { locationFound: { contains: query.q, mode: "insensitive" } },
      { province: { contains: query.q, mode: "insensitive" } },
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

/**
 * POST /api/animals (admin) — AVAILABLE by default; ADOPTED for an animal adopted offline.
 * Adopted animals are never urgent (isUrgent is saved as false).
 */
export async function createAnimal(req: Request, res: Response): Promise<void> {
  const data = createAnimalSchema.parse(req.body);
  const adopted = data.status === AnimalStatus.ADOPTED;
  const animal = await prisma.animal.create({
    data: { ...data, isUrgent: adopted ? false : data.isUrgent, adoptedAt: adopted ? new Date() : null },
    include: animalDetailInclude,
  });
  res.status(201).json(toAnimalDetail(animal));
}

/**
 * PATCH /api/animals/:id (admin) — partial update; photos removed from the list are deleted from Storage.
 *
 * status (admin override, e.g. for an adoption arranged offline):
 *   ADOPTED   → adoptedAt = now, every request still waiting → REJECTED
 *   AVAILABLE → back up for adoption (adoptedAt cleared); the approved request, if it was adopted
 *               through the website, → REJECTED, so that person no longer counts as the adopter
 * An animal that is (or becomes) ADOPTED is never urgent: isUrgent is saved as false.
 */
export async function updateAnimal(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const { status, ...fields } = updateAnimalSchema.parse(req.body);

  const existing = await prisma.animal.findUnique({ where: { id }, select: { imageUrls: true } });
  if (!existing) {
    throw new HttpError(404, "Animal not found");
  }

  const animal = await prisma.$transaction(async (tx) => {
    // Same lock as adoption requests, so a status change can't race an approval.
    await lockAnimal(tx, id);
    const current = await tx.animal.findUniqueOrThrow({ where: { id }, select: { status: true } });

    const data: Prisma.AnimalUpdateInput = { ...fields };
    let newStatus = current.status;
    if (status === AnimalStatus.ADOPTED && current.status !== AnimalStatus.ADOPTED) {
      await rejectPendingRequests(tx, id);
      newStatus = AnimalStatus.ADOPTED;
      data.adoptedAt = new Date();
    } else if (status === AnimalStatus.AVAILABLE && current.status === AnimalStatus.ADOPTED) {
      await tx.adoptionRequest.updateMany({
        where: { animalId: id, status: ReviewStatus.APPROVED },
        data: { status: ReviewStatus.REJECTED },
      });
      newStatus = AnimalStatus.AVAILABLE;
      data.adoptedAt = null;
    }
    data.status = newStatus;
    if (newStatus === AnimalStatus.ADOPTED) {
      data.isUrgent = false;
    }

    return tx.animal.update({ where: { id }, data, include: animalDetailInclude });
  }, TRANSACTION_OPTIONS);

  if (fields.imageUrls) {
    // Photos the original report (or anything else) still shows are kept.
    const kept = new Set(fields.imageUrls);
    await deleteUnusedImages(existing.imageUrls.filter((url) => !kept.has(url)));
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
    select: { imageUrls: true, updates: { select: { imageUrls: true } } },
  });
  if (!existing) {
    throw new HttpError(404, "Animal not found");
  }

  await prisma.animal.delete({ where: { id } });

  // The original report is kept, so the photos it shares with the animal stay too.
  await deleteUnusedImages([...existing.imageUrls, ...existing.updates.flatMap((update) => update.imageUrls)]);

  res.status(204).end();
}
