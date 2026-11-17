-- Animal: description, sterilized flag, province, and personality as a list of tags.
-- Written by hand (instead of Prisma's generated SQL) so it also works on a table that
-- already has rows and keeps the existing personality text.

-- New required columns: existing rows get a value first, then the default is removed so
-- every new row must provide them.
ALTER TABLE "Animal"
    ADD COLUMN "description" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "isSterilized" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "province" TEXT NOT NULL DEFAULT 'กรุงเทพมหานคร';

ALTER TABLE "Animal"
    ALTER COLUMN "description" DROP DEFAULT,
    ALTER COLUMN "province" DROP DEFAULT;

-- personality: text -> list of tags. The old text becomes the first tag (no data lost).
ALTER TABLE "Animal"
    ALTER COLUMN "personality" SET DATA TYPE TEXT[] USING ARRAY["personality"],
    ALTER COLUMN "personality" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Animal_province_idx" ON "Animal"("province");
