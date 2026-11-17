import { AnimalStatus, ReviewStatus, Role, type Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import {
  adminAdoptionRequestSelect,
  myAdoptionRequestSelect,
  toAdminAdoptionRequest,
  toMyAdoptionRequest,
  type AdminAdoptionRequest,
} from "../lib/adoption-request-dto";
import { TRANSACTION_OPTIONS, lockAnimal, rejectPendingRequests } from "../lib/animal-status";
import { HttpError } from "../lib/http-error";
import { prisma } from "../lib/prisma";
import { getAuthUser } from "../middlewares/auth";
import type { Paginated } from "../types/api";
import {
  createAdoptionRequestSchema,
  listAdoptionRequestsQuerySchema,
  myAdoptionRequestsQuerySchema,
  reviewAdoptionRequestSchema,
} from "../validators/adoption-request.validator";
import { idParamSchema } from "../validators/common";

/*
 * Status rules: only requests are PENDING. The animal stays AVAILABLE (anyone can still apply)
 * until a request is approved:
 *   request approved             → request APPROVED, animal ADOPTED (+ adoptedAt, no longer urgent),
 *                                  every other PENDING request for it → REJECTED
 *   request rejected / cancelled → the animal doesn't change
 *   rejected user applies again  → the same request goes back to PENDING (new reason, new date)
 *
 * Every change runs in a transaction that first locks the animal's row, so two changes for the
 * same animal (e.g. two admins approving different requests at once) happen one after the other.
 * (Helpers in lib/animal-status.ts, shared with the admin status override on animals.)
 */

/** POST /api/adoption-requests (users) */
export async function createAdoptionRequest(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  if (user.role !== Role.USER) {
    throw new HttpError(403, "Admins can't send adoption requests");
  }
  const { animalId, reason, housingType } = createAdoptionRequestSchema.parse(req.body);

  const request = await prisma.$transaction(async (tx) => {
    if (!(await lockAnimal(tx, animalId))) {
      throw new HttpError(404, "Animal not found");
    }
    const animal = await tx.animal.findUniqueOrThrow({ where: { id: animalId }, select: { status: true } });
    if (animal.status === AnimalStatus.ADOPTED) {
      throw new HttpError(409, "This animal has already been adopted");
    }

    const existing = await tx.adoptionRequest.findUnique({
      where: { userId_animalId: { userId: user.id, animalId } },
      select: { id: true, status: true },
    });
    if (existing && existing.status !== ReviewStatus.REJECTED) {
      throw new HttpError(409, "You have already sent a request for this animal");
    }

    // One request per user and animal: after a rejection, applying again reuses that request.
    const data = { reason, housingType, status: ReviewStatus.PENDING, createdAt: new Date() };
    return existing
      ? tx.adoptionRequest.update({ where: { id: existing.id }, data, select: myAdoptionRequestSelect })
      : tx.adoptionRequest.create({
          data: { ...data, userId: user.id, animalId },
          select: myAdoptionRequestSelect,
        });
  }, TRANSACTION_OPTIONS);

  res.status(201).json(toMyAdoptionRequest(request));
}

/** GET /api/adoption-requests/me?status= — the signed-in user's requests, newest first. */
export async function listMyAdoptionRequests(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { status } = myAdoptionRequestsQuerySchema.parse(req.query);

  const requests = await prisma.adoptionRequest.findMany({
    where: { userId: user.id, status },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: myAdoptionRequestSelect,
  });
  res.json(requests.map(toMyAdoptionRequest));
}

/** DELETE /api/adoption-requests/:id — the applicant cancels their own PENDING request. */
export async function cancelAdoptionRequest(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { id } = idParamSchema.parse(req.params);

  const request = await prisma.adoptionRequest.findUnique({
    where: { id },
    select: { userId: true, animalId: true },
  });
  if (!request) {
    throw new HttpError(404, "Adoption request not found");
  }
  if (request.userId !== user.id) {
    throw new HttpError(403, "You can only cancel your own requests");
  }

  await prisma.$transaction(async (tx) => {
    await lockAnimal(tx, request.animalId);
    const { count } = await tx.adoptionRequest.deleteMany({ where: { id, status: ReviewStatus.PENDING } });
    if (count === 0) {
      throw new HttpError(409, "Only pending requests can be cancelled");
    }
  }, TRANSACTION_OPTIONS);

  res.status(204).end();
}

/** GET /api/adoption-requests?status=&animalId=&page=&pageSize= (admin) — newest first. */
export async function listAdoptionRequests(req: Request, res: Response): Promise<void> {
  const query = listAdoptionRequestsQuerySchema.parse(req.query);
  const where: Prisma.AdoptionRequestWhereInput = { status: query.status, animalId: query.animalId };

  const [rows, total] = await prisma.$transaction([
    prisma.adoptionRequest.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: adminAdoptionRequestSelect,
    }),
    prisma.adoptionRequest.count({ where }),
  ]);

  const body: Paginated<AdminAdoptionRequest> = {
    data: rows.map(toAdminAdoptionRequest),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
  res.json(body);
}

/** PATCH /api/adoption-requests/:id (admin) — approve or reject a PENDING request. */
export async function reviewAdoptionRequest(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const { status } = reviewAdoptionRequestSchema.parse(req.body);

  const found = await prisma.adoptionRequest.findUnique({ where: { id }, select: { animalId: true } });
  if (!found) {
    throw new HttpError(404, "Adoption request not found");
  }
  const { animalId } = found;

  const request = await prisma.$transaction(async (tx) => {
    await lockAnimal(tx, animalId);

    // Re-read after locking: another admin may have decided in the meantime.
    const current = await tx.adoptionRequest.findUnique({ where: { id }, select: { status: true } });
    if (!current) {
      throw new HttpError(404, "Adoption request not found");
    }
    if (current.status !== ReviewStatus.PENDING) {
      throw new HttpError(409, `This request was already ${current.status.toLowerCase()}`);
    }

    if (status === ReviewStatus.APPROVED) {
      const animal = await tx.animal.findUniqueOrThrow({ where: { id: animalId }, select: { status: true } });
      if (animal.status === AnimalStatus.ADOPTED) {
        throw new HttpError(409, "This animal has already been adopted");
      }
      await tx.adoptionRequest.update({ where: { id }, data: { status } });
      await rejectPendingRequests(tx, animalId);
      await tx.animal.update({
        where: { id: animalId },
        data: { status: AnimalStatus.ADOPTED, adoptedAt: new Date(), isUrgent: false },
      });
    } else {
      await tx.adoptionRequest.update({ where: { id }, data: { status } });
    }

    return tx.adoptionRequest.findUniqueOrThrow({ where: { id }, select: adminAdoptionRequestSelect });
  }, TRANSACTION_OPTIONS);

  res.json(toAdminAdoptionRequest(request));
}
