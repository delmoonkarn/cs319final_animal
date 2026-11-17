import { DonationStatus, Role, type Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import {
  adminDonationSelect,
  myDonationSelect,
  toAdminDonation,
  toMyDonation,
  type AdminDonation,
  type DonationSummary,
} from "../lib/donation-dto";
import { HttpError } from "../lib/http-error";
import { prisma } from "../lib/prisma";
import { deleteImages } from "../lib/storage";
import { getAuthUser } from "../middlewares/auth";
import type { Paginated } from "../types/api";
import { idParamSchema } from "../validators/common";
import {
  createDonationSchema,
  listDonationsQuerySchema,
  reviewDonationSchema,
} from "../validators/donation.validator";

/** GET /api/donations/summary — public total of confirmed donations (for the homepage). */
export async function getDonationSummary(_req: Request, res: Response): Promise<void> {
  const { _sum, _count } = await prisma.donation.aggregate({
    where: { status: DonationStatus.CONFIRMED },
    _sum: { total: true },
    _count: { _all: true },
  });
  const body: DonationSummary = { totalConfirmed: _sum.total ?? 0, confirmedCount: _count._all };
  res.json(body);
}

/**
 * POST /api/donations — any signed-in user.
 * unitPrice and total are calculated here from the packages in the database;
 * prices sent by the client are ignored.
 */
export async function createDonation(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { items, slipUrl } = createDonationSchema.parse(req.body);

  const packages = await prisma.donationPackage.findMany({
    where: { id: { in: items.map((item) => item.packageId) } },
    select: { id: true, price: true },
  });
  const priceById = new Map(packages.map((p) => [p.id, p.price]));

  const lines = items.map((item) => {
    const unitPrice = priceById.get(item.packageId);
    if (unitPrice === undefined) {
      throw new HttpError(400, `Donation package ${item.packageId} does not exist`);
    }
    return { packageId: item.packageId, quantity: item.quantity, unitPrice };
  });
  const total = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

  const donation = await prisma.donation.create({
    data: { userId: user.id, slipUrl, total, items: { create: lines } },
    select: myDonationSelect,
  });
  res.status(201).json(toMyDonation(donation));
}

/** GET /api/donations/me — the signed-in user's donations, newest first. */
export async function listMyDonations(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const donations = await prisma.donation.findMany({
    where: { userId: user.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: myDonationSelect,
  });
  res.json(donations.map(toMyDonation));
}

/** GET /api/donations?status=&page=&pageSize= (admin) — newest first. */
export async function listDonations(req: Request, res: Response): Promise<void> {
  const query = listDonationsQuerySchema.parse(req.query);
  const where: Prisma.DonationWhereInput = { status: query.status };

  const [rows, total] = await prisma.$transaction([
    prisma.donation.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: adminDonationSelect,
    }),
    prisma.donation.count({ where }),
  ]);

  const body: Paginated<AdminDonation> = {
    data: rows.map(toAdminDonation),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
  res.json(body);
}

/** PATCH /api/donations/:id (admin) — confirm the slip (or set it back to PENDING). */
export async function reviewDonation(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const { status } = reviewDonationSchema.parse(req.body);
  const exists = await prisma.donation.findUnique({ where: { id }, select: { id: true } });
  if (!exists) {
    throw new HttpError(404, "Donation not found");
  }
  const donation = await prisma.donation.update({ where: { id }, data: { status }, select: adminDonationSelect });
  res.json(toAdminDonation(donation));
}

/**
 * DELETE /api/donations/:id — the donor (only while PENDING) or an admin (any donation).
 * Its items are removed with it (cascade) and the slip photo is deleted from Storage.
 */
export async function deleteDonation(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { id } = idParamSchema.parse(req.params);

  const donation = await prisma.donation.findUnique({ where: { id }, select: { userId: true, slipUrl: true } });
  if (!donation) {
    throw new HttpError(404, "Donation not found");
  }

  if (user.role === Role.ADMIN) {
    await prisma.donation.delete({ where: { id } });
  } else {
    if (donation.userId !== user.id) {
      throw new HttpError(403, "You can only delete your own donations");
    }
    const { count } = await prisma.donation.deleteMany({
      where: { id, userId: user.id, status: DonationStatus.PENDING },
    });
    if (count === 0) {
      throw new HttpError(409, "Only pending donations can be deleted");
    }
  }

  await deleteImages([donation.slipUrl]);
  res.status(204).end();
}
