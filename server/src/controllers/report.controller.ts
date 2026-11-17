import { ReviewStatus, Role, type Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { HttpError } from "../lib/http-error";
import { prisma } from "../lib/prisma";
import {
  adminReportSelect,
  myReportSelect,
  toAdminReport,
  toMyReport,
  type AdminReport,
} from "../lib/report-dto";
import { deleteImages } from "../lib/storage";
import { getAuthUser } from "../middlewares/auth";
import type { Paginated } from "../types/api";
import { idParamSchema } from "../validators/common";
import { createReportSchema, listReportsQuerySchema, reviewReportSchema } from "../validators/report.validator";

/*
 * Community reports of found / injured animals.
 *   approve → a new AVAILABLE animal is created from the report (same photos) and linked to it
 *   reject  → the report's photos are deleted from Storage
 */

/** POST /api/reports — any signed-in user. */
export async function createReport(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const data = createReportSchema.parse(req.body);
  const report = await prisma.report.create({
    data: { ...data, breed: data.breed ?? null, userId: user.id },
    select: myReportSelect,
  });
  res.status(201).json(toMyReport(report));
}

/** GET /api/reports/me — the signed-in user's reports, newest first. */
export async function listMyReports(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const reports = await prisma.report.findMany({
    where: { userId: user.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: myReportSelect,
  });
  res.json(reports.map(toMyReport));
}

/** GET /api/reports/:id — the reporter or an admin. */
export async function getReport(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { id } = idParamSchema.parse(req.params);
  const report = await prisma.report.findUnique({ where: { id }, select: adminReportSelect });
  if (!report) {
    throw new HttpError(404, "Report not found");
  }
  if (user.role === Role.ADMIN) {
    res.json(toAdminReport(report));
    return;
  }
  if (report.reporter.id !== user.id) {
    throw new HttpError(403, "You can only view your own reports");
  }
  const { reporter: _reporter, ...ownReport } = report;
  res.json(toMyReport(ownReport));
}

/** GET /api/reports?status=&species=&page=&pageSize= (admin) — newest first. */
export async function listReports(req: Request, res: Response): Promise<void> {
  const query = listReportsQuerySchema.parse(req.query);
  const where: Prisma.ReportWhereInput = { status: query.status, species: query.species };

  const [rows, total] = await prisma.$transaction([
    prisma.report.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: adminReportSelect,
    }),
    prisma.report.count({ where }),
  ]);

  const body: Paginated<AdminReport> = {
    data: rows.map(toAdminReport),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
  res.json(body);
}

/** PATCH /api/reports/:id (admin) — approve (creates the animal) or reject (deletes the photos). */
export async function reviewReport(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const decision = reviewReportSchema.parse(req.body);

  const report = await prisma.report.findUnique({
    where: { id },
    select: { status: true, species: true, breed: true, imageUrls: true, location: true },
  });
  if (!report) {
    throw new HttpError(404, "Report not found");
  }
  const alreadyReviewed = () => new HttpError(409, "This report has already been reviewed");
  if (report.status !== ReviewStatus.PENDING) {
    throw alreadyReviewed();
  }

  if (decision.status === ReviewStatus.REJECTED) {
    const { count } = await prisma.report.updateMany({
      where: { id, status: ReviewStatus.PENDING },
      data: { status: ReviewStatus.REJECTED, imageUrls: [] },
    });
    if (count === 0) {
      throw alreadyReviewed();
    }
    await deleteImages(report.imageUrls);
  } else {
    const details = decision.animal;
    const breed = details.breed ?? report.breed;
    if (!breed) {
      throw new HttpError(400, "animal.breed is required because the report has no breed");
    }
    const imageUrls = details.imageUrls ?? report.imageUrls;
    if (imageUrls.length === 0) {
      throw new HttpError(400, "animal.imageUrls is required because the report has no photos");
    }

    await prisma.$transaction(async (tx) => {
      // Only one admin can approve: the status check and the change happen in one statement.
      const { count } = await tx.report.updateMany({
        where: { id, status: ReviewStatus.PENDING },
        data: { status: ReviewStatus.APPROVED, breed },
      });
      if (count === 0) {
        throw alreadyReviewed();
      }
      const animal = await tx.animal.create({
        data: {
          name: details.name,
          species: report.species,
          breed,
          gender: details.gender,
          ageMonths: details.ageMonths,
          personality: details.personality,
          healthNote: details.healthNote,
          isVaccinated: details.isVaccinated,
          isUrgent: details.isUrgent,
          imageUrls,
          locationFound: details.locationFound ?? report.location,
        },
        select: { id: true },
      });
      await tx.report.update({ where: { id }, data: { animalId: animal.id } });
    });
  }

  const updated = await prisma.report.findUniqueOrThrow({ where: { id }, select: adminReportSelect });
  res.json(toAdminReport(updated));
}

/**
 * DELETE /api/reports/:id — the reporter (only while PENDING) or an admin (any report).
 * Photos are deleted too, except those now used by the animal created from the report.
 */
export async function deleteReport(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { id } = idParamSchema.parse(req.params);

  const report = await prisma.report.findUnique({
    where: { id },
    select: { userId: true, imageUrls: true, animal: { select: { imageUrls: true } } },
  });
  if (!report) {
    throw new HttpError(404, "Report not found");
  }

  if (user.role === Role.ADMIN) {
    await prisma.report.delete({ where: { id } });
  } else {
    if (report.userId !== user.id) {
      throw new HttpError(403, "You can only delete your own reports");
    }
    const { count } = await prisma.report.deleteMany({
      where: { id, userId: user.id, status: ReviewStatus.PENDING },
    });
    if (count === 0) {
      throw new HttpError(409, "Only pending reports can be deleted");
    }
  }

  const usedByAnimal = new Set(report.animal?.imageUrls ?? []);
  await deleteImages(report.imageUrls.filter((url) => !usedByAnimal.has(url)));
  res.status(204).end();
}
