import { AnimalStatus, ReviewStatus, Role } from "@prisma/client";
import type { Request, Response } from "express";
import { animalUpdateSelect, toAnimalUpdateItem, type AnimalUpdateItem } from "../lib/animal-update-dto";
import { HttpError } from "../lib/http-error";
import { prisma } from "../lib/prisma";
import type { PublicUser } from "../lib/public-user";
import { deleteUnusedImages } from "../lib/image-cleanup";
import { getAuthUser } from "../middlewares/auth";
import type { Paginated } from "../types/api";
import {
  createAnimalUpdateSchema,
  editAnimalUpdateSchema,
  listAnimalUpdatesQuerySchema,
} from "../validators/animal-update.validator";
import { idParamSchema } from "../validators/common";

/** Success stories: the admin or the animal's adopter can post; the author or the admin can edit/delete. */

/** Loads an update and checks the user may change it (its author or an admin). */
async function findEditableUpdate(id: number, user: PublicUser) {
  const update = await prisma.animalUpdate.findUnique({
    where: { id },
    select: { authorId: true, imageUrls: true },
  });
  if (!update) {
    throw new HttpError(404, "Update not found");
  }
  if (user.role !== Role.ADMIN && update.authorId !== user.id) {
    throw new HttpError(403, "Only the author or an admin can change this update");
  }
  return update;
}

/** GET /api/animal-updates?animalId=&page=&pageSize= — public feed, newest first. */
export async function listAnimalUpdates(req: Request, res: Response): Promise<void> {
  const query = listAnimalUpdatesQuerySchema.parse(req.query);
  const where = { animalId: query.animalId };

  const [rows, total] = await prisma.$transaction([
    prisma.animalUpdate.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: animalUpdateSelect,
    }),
    prisma.animalUpdate.count({ where }),
  ]);

  const body: Paginated<AnimalUpdateItem> = {
    data: rows.map(toAnimalUpdateItem),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
  res.json(body);
}

/** POST /api/animal-updates — admin, or the user whose adoption request was approved. */
export async function createAnimalUpdate(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { animalId, caption, imageUrls } = createAnimalUpdateSchema.parse(req.body);

  const animal = await prisma.animal.findUnique({ where: { id: animalId }, select: { status: true } });
  if (!animal) {
    throw new HttpError(404, "Animal not found");
  }
  if (animal.status !== AnimalStatus.ADOPTED) {
    throw new HttpError(409, "Success stories can only be posted for adopted animals");
  }
  if (user.role !== Role.ADMIN) {
    const adoption = await prisma.adoptionRequest.findFirst({
      where: { animalId, userId: user.id, status: ReviewStatus.APPROVED },
      select: { id: true },
    });
    if (!adoption) {
      throw new HttpError(403, "Only an admin or this animal's adopter can post updates");
    }
  }

  const update = await prisma.animalUpdate.create({
    data: { animalId, authorId: user.id, caption, imageUrls },
    select: animalUpdateSelect,
  });
  res.status(201).json(toAnimalUpdateItem(update));
}

/** PATCH /api/animal-updates/:id — photos removed from the list are deleted from Storage. */
export async function editAnimalUpdate(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { id } = idParamSchema.parse(req.params);
  const data = editAnimalUpdateSchema.parse(req.body);
  const existing = await findEditableUpdate(id, user);

  const update = await prisma.animalUpdate.update({ where: { id }, data, select: animalUpdateSelect });

  if (data.imageUrls) {
    const kept = new Set(data.imageUrls);
    await deleteUnusedImages(existing.imageUrls.filter((url) => !kept.has(url)));
  }
  res.json(toAnimalUpdateItem(update));
}

/** DELETE /api/animal-updates/:id — also deletes its photos from Storage. */
export async function deleteAnimalUpdate(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { id } = idParamSchema.parse(req.params);
  const existing = await findEditableUpdate(id, user);

  await prisma.animalUpdate.delete({ where: { id } });
  await deleteUnusedImages(existing.imageUrls);
  res.status(204).end();
}
