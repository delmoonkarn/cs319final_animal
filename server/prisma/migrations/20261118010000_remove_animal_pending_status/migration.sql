-- Animals are only AVAILABLE or ADOPTED; "pending" now exists only on adoption requests.
-- Animals that were PENDING go back to AVAILABLE (their requests stay PENDING).
BEGIN;
UPDATE "Animal" SET "status" = 'AVAILABLE' WHERE "status" = 'PENDING';

CREATE TYPE "AnimalStatus_new" AS ENUM ('AVAILABLE', 'ADOPTED');
ALTER TABLE "Animal" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Animal" ALTER COLUMN "status" TYPE "AnimalStatus_new" USING ("status"::text::"AnimalStatus_new");
ALTER TYPE "AnimalStatus" RENAME TO "AnimalStatus_old";
ALTER TYPE "AnimalStatus_new" RENAME TO "AnimalStatus";
DROP TYPE "AnimalStatus_old";
ALTER TABLE "Animal" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';
COMMIT;
