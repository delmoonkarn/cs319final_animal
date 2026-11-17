import { ReviewStatus, type Prisma } from "@prisma/client";

/*
 * Helpers for changes that touch an animal's adoption state (requests, approval, admin override).
 * Every change runs inside a transaction that first locks the animal's row, so two changes
 * for the same animal (e.g. two admins at once) happen one after the other.
 */

export const TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 15_000 };

/** Locks the animal row until the transaction ends. Returns false if the animal doesn't exist. */
export async function lockAnimal(tx: Prisma.TransactionClient, animalId: number): Promise<boolean> {
  const { count } = await tx.animal.updateMany({ where: { id: animalId }, data: { updatedAt: new Date() } });
  return count === 1;
}

/** Rejects every request for the animal that is still waiting (used when it gets adopted). */
export async function rejectPendingRequests(tx: Prisma.TransactionClient, animalId: number): Promise<number> {
  const { count } = await tx.adoptionRequest.updateMany({
    where: { animalId, status: ReviewStatus.PENDING },
    data: { status: ReviewStatus.REJECTED },
  });
  return count;
}
