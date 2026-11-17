import type { Request, Response } from "express";
import { HttpError } from "../lib/http-error";
import { prisma } from "../lib/prisma";
import { idParamSchema } from "../validators/common";
import { createPackageSchema, updatePackageSchema } from "../validators/donation.validator";

/** GET /api/donation-packages — public, cheapest first. */
export async function listPackages(_req: Request, res: Response): Promise<void> {
  const packages = await prisma.donationPackage.findMany({ orderBy: [{ price: "asc" }, { id: "asc" }] });
  res.json(packages);
}

/** POST /api/donation-packages (admin) */
export async function createPackage(req: Request, res: Response): Promise<void> {
  const data = createPackageSchema.parse(req.body);
  const donationPackage = await prisma.donationPackage.create({ data });
  res.status(201).json(donationPackage);
}

/** PATCH /api/donation-packages/:id (admin) — past donations keep the price they were made at. */
export async function updatePackage(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const data = updatePackageSchema.parse(req.body);
  const exists = await prisma.donationPackage.findUnique({ where: { id }, select: { id: true } });
  if (!exists) {
    throw new HttpError(404, "Donation package not found");
  }
  const donationPackage = await prisma.donationPackage.update({ where: { id }, data });
  res.json(donationPackage);
}

/** DELETE /api/donation-packages/:id (admin) — only packages nobody has donated yet. */
export async function deletePackage(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const donationPackage = await prisma.donationPackage.findUnique({
    where: { id },
    select: { _count: { select: { items: true } } },
  });
  if (!donationPackage) {
    throw new HttpError(404, "Donation package not found");
  }
  if (donationPackage._count.items > 0) {
    throw new HttpError(409, "This package is part of past donations and can't be deleted (edit it instead)");
  }
  await prisma.donationPackage.delete({ where: { id } });
  res.status(204).end();
}
