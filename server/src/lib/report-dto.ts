import type { Prisma } from "@prisma/client";
import type { ImageDto } from "../types/api";
import { toImageDto } from "./animal-dto";

/** Response shapes for community reports, and the queries that produce them. */

/** What the reporter sees. `animal` is set once an admin approved the report. */
export const myReportSelect = {
  id: true,
  species: true,
  breed: true,
  imageUrls: true,
  location: true,
  description: true,
  status: true,
  createdAt: true,
  animal: { select: { id: true, name: true, status: true } },
} as const satisfies Prisma.ReportSelect;

/** What the admin sees: the same plus the reporter's contact details. */
export const adminReportSelect = {
  ...myReportSelect,
  reporter: { select: { id: true, name: true, email: true, phone: true } },
} as const satisfies Prisma.ReportSelect;

type MyReportRow = Prisma.ReportGetPayload<{ select: typeof myReportSelect }>;
type AdminReportRow = Prisma.ReportGetPayload<{ select: typeof adminReportSelect }>;

export type MyReport = Omit<MyReportRow, "imageUrls"> & { images: ImageDto[] };
export type AdminReport = Omit<AdminReportRow, "imageUrls"> & { images: ImageDto[] };

export function toMyReport({ imageUrls, ...report }: MyReportRow): MyReport {
  return { ...report, images: imageUrls.map(toImageDto) };
}

export function toAdminReport({ imageUrls, ...report }: AdminReportRow): AdminReport {
  return { ...report, images: imageUrls.map(toImageDto) };
}
