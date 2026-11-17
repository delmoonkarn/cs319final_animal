import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { favoriteSelect, toFavoriteDto } from "../lib/favorite-dto";
import { HttpError } from "../lib/http-error";
import { prisma } from "../lib/prisma";
import { getAuthUser } from "../middlewares/auth";
import { favoriteParamSchema } from "../validators/favorite.validator";

/** GET /api/favorites — the signed-in user's wishlist, most recently added first. */
export async function listFavorites(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: favoriteSelect,
  });
  res.json(favorites.map(toFavoriteDto));
}

/** PUT /api/favorites/:animalId — add to the wishlist (doing it twice is fine). */
export async function addFavorite(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { animalId } = favoriteParamSchema.parse(req.params);

  const animal = await prisma.animal.findUnique({ where: { id: animalId }, select: { id: true } });
  if (!animal) {
    throw new HttpError(404, "Animal not found");
  }

  try {
    await prisma.favorite.upsert({
      where: { userId_animalId: { userId: user.id, animalId } },
      create: { userId: user.id, animalId },
      update: {},
    });
  } catch (error) {
    // Two clicks at the same moment: the other one already added it.
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
      throw error;
    }
  }
  res.status(204).end();
}

/** DELETE /api/favorites/:animalId — remove from the wishlist (fine if it wasn't there). */
export async function removeFavorite(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { animalId } = favoriteParamSchema.parse(req.params);
  await prisma.favorite.deleteMany({ where: { userId: user.id, animalId } });
  res.status(204).end();
}
