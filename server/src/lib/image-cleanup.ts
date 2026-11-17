import { prisma } from "./prisma";
import { deleteImages } from "./storage";

/**
 * Deletes uploaded images from Storage, except those another record still shows.
 *
 * Image URLs are public, so the same photo can be listed by several records: an animal created
 * from a report shares the report's photos, and a user could paste any photo's URL into their own
 * report, story or donation slip. Deleting one record must never break the others.
 *
 * Call it AFTER the database change, so the record being edited or deleted no longer counts.
 * Upload URLs are stored exactly as POST /api/uploads returns them (see isAcceptedImageUrl),
 * so comparing the strings is enough.
 */
export async function deleteUnusedImages(urls: readonly string[]): Promise<void> {
  const candidates = [...new Set(urls)];
  if (candidates.length === 0) {
    return;
  }

  const [animals, reports, updates, donations] = await prisma.$transaction([
    prisma.animal.findMany({ where: { imageUrls: { hasSome: candidates } }, select: { imageUrls: true } }),
    prisma.report.findMany({ where: { imageUrls: { hasSome: candidates } }, select: { imageUrls: true } }),
    prisma.animalUpdate.findMany({ where: { imageUrls: { hasSome: candidates } }, select: { imageUrls: true } }),
    prisma.donation.findMany({ where: { slipUrl: { in: candidates } }, select: { slipUrl: true } }),
  ]);
  const stillUsed = new Set([
    ...[...animals, ...reports, ...updates].flatMap((row) => row.imageUrls),
    ...donations.map((donation) => donation.slipUrl),
  ]);

  await deleteImages(candidates.filter((url) => !stillUsed.has(url)));
}
