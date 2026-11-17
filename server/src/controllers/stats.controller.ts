import { AnimalStatus, DonationStatus, ReviewStatus } from "@prisma/client";
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";

/** Numbers for the homepage stats bar. */
export type AnimalStats = {
  total: number;
  /** Still looking for a home */
  available: number;
  adopted: number;
  /** Urgent cases that are still available */
  urgent: number;
};

/** Admin dashboard: animal numbers + the queues waiting for an admin. */
export type AdminStats = AnimalStats & {
  pendingRequests: number;
  pendingReports: number;
  pendingDonations: number;
};

async function countAnimals(): Promise<AnimalStats> {
  const [available, adopted, urgent] = await prisma.$transaction([
    prisma.animal.count({ where: { status: AnimalStatus.AVAILABLE } }),
    prisma.animal.count({ where: { status: AnimalStatus.ADOPTED } }),
    prisma.animal.count({ where: { isUrgent: true, status: AnimalStatus.AVAILABLE } }),
  ]);
  return { total: available + adopted, available, adopted, urgent };
}

/** GET /api/stats — public. */
export async function getStats(_req: Request, res: Response): Promise<void> {
  const body: AnimalStats = await countAnimals();
  res.json(body);
}

/** GET /api/stats/admin (admin) */
export async function getAdminStats(_req: Request, res: Response): Promise<void> {
  const animals = await countAnimals();
  const [pendingRequests, pendingReports, pendingDonations] = await prisma.$transaction([
    prisma.adoptionRequest.count({ where: { status: ReviewStatus.PENDING } }),
    prisma.report.count({ where: { status: ReviewStatus.PENDING } }),
    prisma.donation.count({ where: { status: DonationStatus.PENDING } }),
  ]);
  const body: AdminStats = { ...animals, pendingRequests, pendingReports, pendingDonations };
  res.json(body);
}
