import type { Prisma, ReviewStatus } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
// Also loads and validates .env (via src/lib/env.ts) before connecting.
import { prisma } from "../src/lib/prisma";
import {
  SEED_PASSWORD,
  adoptionRequests,
  animalUpdates,
  animals,
  donationPackages,
  donations,
  favorites,
  reports,
  users,
} from "./seed-data";

const DAY_MS = 24 * 60 * 60 * 1000;
const seedTime = Date.now();

function daysAgo(days: number): Date {
  return new Date(seedTime - days * DAY_MS);
}

/** External placeholder photos (not uploaded to Supabase Storage). */
function placeholderImages(prefix: string, count: number, width = 800, height = 600): string[] {
  return Array.from({ length: count }, (_, i) => `https://picsum.photos/seed/${prefix}-${i + 1}/${width}/${height}`);
}

function isHttpUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function lookup<V>(map: ReadonlyMap<string, V>, key: string, what: string): V {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(`Seed data refers to an unknown ${what}: "${key}"`);
  }
  return value;
}

// ─────────────────────────── Consistency checks ───────────────────────────

/** Refuses to seed data that breaks the app's rules (so edits to seed-data.ts stay consistent). */
function validateSeedData(): void {
  const errors: string[] = [];
  const check = (ok: boolean, message: string): void => {
    if (!ok) errors.push(message);
  };

  const userByEmail = new Map(users.map((u) => [u.email, u]));
  const animalByKey = new Map(animals.map((a) => [a.key, a]));
  const packageKeys = new Set(donationPackages.map((p) => p.key));

  check(userByEmail.size === users.length, "user emails must be unique");
  check(animalByKey.size === animals.length, "animal keys must be unique");
  check(new Set(animals.map((a) => a.name)).size === animals.length, "animal names must be unique");

  // The assignment requires at least 40 seeded records in total.
  const totalRecords =
    users.length + animals.length + adoptionRequests.length + favorites.length + animalUpdates.length +
    reports.length + donationPackages.length + donations.length +
    donations.reduce((sum, d) => sum + d.items.length, 0);
  check(totalRecords >= 40, `the seed must create at least 40 records (currently ${totalRecords})`);

  // Animals ↔ adoption requests ↔ updates
  for (const animal of animals) {
    const requests = adoptionRequests.filter((r) => r.animal === animal.key);
    const countWith = (status: ReviewStatus) => requests.filter((r) => r.status === status).length;

    check(animal.imageUrls.length >= 1 && animal.imageUrls.length <= 5, `${animal.key}: needs 1-5 imageUrls`);
    check(new Set(animal.imageUrls).size === animal.imageUrls.length, `${animal.key}: the same image is listed twice`);
    check(animal.imageUrls.every(isHttpUrl), `${animal.key}: every image must be an http(s) link`);
    check(
      animal.personality.length >= 1 && animal.personality.length <= 8 &&
        new Set(animal.personality).size === animal.personality.length &&
        animal.personality.every((tag) => tag.trim().length > 0),
      `${animal.key}: needs 1-8 different, non-empty personality tags`,
    );
    check(animal.description.trim().length > 0, `${animal.key}: needs a description`);

    if (animal.status === "ADOPTED") {
      const approved = requests.find((r) => r.status === "APPROVED");
      const updates = animalUpdates.filter((u) => u.animal === animal.key);
      check(countWith("APPROVED") === 1, `${animal.key}: ADOPTED needs exactly one APPROVED request`);
      check(countWith("PENDING") === 0, `${animal.key}: ADOPTED can't have PENDING requests`);
      check(!animal.isUrgent, `${animal.key}: ADOPTED animals can't be urgent`);
      check(
        animal.adoptedDaysAgo !== undefined && animal.adoptedDaysAgo < animal.daysAgo,
        `${animal.key}: ADOPTED needs adoptedDaysAgo, later than the listing date`,
      );
      check(
        !approved || animal.adoptedDaysAgo === undefined || approved.daysAgo > animal.adoptedDaysAgo,
        `${animal.key}: the APPROVED request must come before the adoption date`,
      );
      check(updates.length >= 2 && updates.length <= 4, `${animal.key}: ADOPTED needs 2-4 updates`);
    } else {
      check(animal.adoptedDaysAgo === undefined, `${animal.key}: only ADOPTED animals have adoptedDaysAgo`);
      check(countWith("APPROVED") === 0, `${animal.key}: only ADOPTED animals can have an APPROVED request`);
    }
  }

  const requestPairs = new Set<string>();
  for (const r of adoptionRequests) {
    const pair = `${r.user}|${r.animal}`;
    check(!requestPairs.has(pair), `duplicate adoption request ${pair}`);
    requestPairs.add(pair);
    check(userByEmail.get(r.user)?.role === "USER", `request ${pair}: requester must be an existing USER`);
    const animal = animalByKey.get(r.animal);
    check(animal !== undefined && r.daysAgo < animal.daysAgo, `request ${pair}: must be after the listing date`);
  }

  const favoritePairs = new Set<string>();
  for (const f of favorites) {
    const pair = `${f.user}|${f.animal}`;
    check(!favoritePairs.has(pair), `duplicate favorite ${pair}`);
    favoritePairs.add(pair);
    check(userByEmail.has(f.user) && animalByKey.has(f.animal), `favorite ${pair}: unknown user or animal`);
  }

  for (const u of animalUpdates) {
    const animal = animalByKey.get(u.animal);
    const adopter = adoptionRequests.find((r) => r.animal === u.animal && r.status === "APPROVED")?.user;
    const label = `update for ${u.animal} (${u.daysAgo} days ago)`;
    check(animal?.status === "ADOPTED", `${label}: updates are only for ADOPTED animals`);
    check(u.images >= 1 && u.images <= 4, `${label}: needs 1-4 images`);
    check(
      userByEmail.get(u.author)?.role === "ADMIN" || u.author === adopter,
      `${label}: author must be the admin or the adopter`,
    );
    check(
      animal?.adoptedDaysAgo !== undefined && u.daysAgo <= animal.adoptedDaysAgo,
      `${label}: must be after the adoption date`,
    );
  }

  const linkedAnimals = new Set<string>();
  for (const [index, r] of reports.entries()) {
    const label = `report #${index + 1}`;
    check(userByEmail.has(r.user), `${label}: unknown user`);
    check(r.images >= 1 && r.images <= 3, `${label}: needs 1-3 images`);
    if (r.status === "APPROVED") {
      const animal = r.animal === undefined ? undefined : animalByKey.get(r.animal);
      check(animal !== undefined, `${label}: APPROVED reports must link to an animal`);
      if (animal) {
        check(!linkedAnimals.has(animal.key), `${label}: animal ${animal.key} is already linked to a report`);
        linkedAnimals.add(animal.key);
        check(animal.species === r.species && animal.breed === r.breed, `${label}: species/breed must match ${animal.key}`);
        check(r.daysAgo > animal.daysAgo, `${label}: the report must come before the listing`);
      }
    } else {
      check(r.animal === undefined, `${label}: only APPROVED reports link to an animal`);
    }
  }

  check(new Set(donationPackages.map((p) => p.name)).size === donationPackages.length, "package names must be unique");
  check(packageKeys.size === donationPackages.length, "package keys must be unique");
  for (const [index, d] of donations.entries()) {
    const label = `donation #${index + 1}`;
    const itemPackages = d.items.map((i) => i.package);
    check(userByEmail.has(d.user), `${label}: unknown user`);
    check(d.items.length > 0, `${label}: needs at least one item`);
    check(new Set(itemPackages).size === itemPackages.length, `${label}: each package may appear only once`);
    check(itemPackages.every((key) => packageKeys.has(key)), `${label}: unknown package`);
    check(d.items.every((i) => Number.isInteger(i.quantity) && i.quantity > 0), `${label}: quantities must be positive`);
  }

  if (errors.length > 0) {
    throw new Error(`Seed data is inconsistent:\n  - ${errors.join("\n  - ")}`);
  }
}

// ─────────────────────────── Seeding ───────────────────────────

async function clearDatabase(): Promise<void> {
  // Children before parents, so no foreign key is ever violated.
  await prisma.$transaction([
    prisma.donationItem.deleteMany(),
    prisma.donation.deleteMany(),
    prisma.donationPackage.deleteMany(),
    prisma.animalUpdate.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.adoptionRequest.deleteMany(),
    prisma.report.deleteMany(),
    prisma.animal.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

async function main(): Promise<void> {
  validateSeedData();

  console.log("Clearing existing data...");
  await clearDatabase();

  // Users
  const userRows = await Promise.all(
    users.map(async (u) => ({ ...u, passwordHash: await hashPassword(SEED_PASSWORD) })),
  );
  const createdUsers = await prisma.user.createManyAndReturn({
    data: userRows,
    select: { id: true, email: true },
  });
  const userId = new Map(createdUsers.map((u) => [u.email, u.id]));

  // Animals
  const animalRows: Prisma.AnimalCreateManyInput[] = animals.map((a) => ({
    name: a.name,
    species: a.species,
    breed: a.breed,
    gender: a.gender,
    ageMonths: a.ageMonths,
    personality: a.personality,
    description: a.description,
    healthNote: a.healthNote,
    isVaccinated: a.isVaccinated,
    isSterilized: a.isSterilized,
    isUrgent: a.isUrgent,
    imageUrls: a.imageUrls,
    locationFound: a.locationFound,
    province: a.province,
    status: a.status,
    adoptedAt: a.adoptedDaysAgo === undefined ? null : daysAgo(a.adoptedDaysAgo),
    createdAt: daysAgo(a.daysAgo),
    updatedAt: daysAgo(a.adoptedDaysAgo ?? a.daysAgo),
  }));
  const createdAnimals = await prisma.animal.createManyAndReturn({
    data: animalRows,
    select: { id: true, name: true },
  });
  const animalIdByName = new Map(createdAnimals.map((a) => [a.name, a.id]));
  const animalId = new Map(animals.map((a) => [a.key, lookup(animalIdByName, a.name, "animal")]));
  const animalByKey = new Map(animals.map((a) => [a.key, a]));

  // Adoption requests
  await prisma.adoptionRequest.createMany({
    data: adoptionRequests.map((r) => ({
      userId: lookup(userId, r.user, "user"),
      animalId: lookup(animalId, r.animal, "animal"),
      reason: r.reason,
      housingType: r.housingType,
      status: r.status,
      createdAt: daysAgo(r.daysAgo),
    })),
  });

  // Favorites (added halfway through each listing's lifetime)
  await prisma.favorite.createMany({
    data: favorites.map((f) => ({
      userId: lookup(userId, f.user, "user"),
      animalId: lookup(animalId, f.animal, "animal"),
      createdAt: daysAgo(Math.ceil(lookup(animalByKey, f.animal, "animal").daysAgo / 2)),
    })),
  });

  // Success-story updates
  await prisma.animalUpdate.createMany({
    data: animalUpdates.map((u, index) => ({
      animalId: lookup(animalId, u.animal, "animal"),
      authorId: lookup(userId, u.author, "user"),
      imageUrls: placeholderImages(`update-${u.animal}-${index + 1}`, u.images),
      caption: u.caption,
      createdAt: daysAgo(u.daysAgo),
    })),
  });

  // Community reports
  await prisma.report.createMany({
    data: reports.map((r, index) => ({
      userId: lookup(userId, r.user, "user"),
      species: r.species,
      breed: r.breed,
      imageUrls: placeholderImages(`report-${index + 1}`, r.images),
      location: r.location,
      description: r.description,
      status: r.status,
      animalId: r.animal === undefined ? null : lookup(animalId, r.animal, "animal"),
      createdAt: daysAgo(r.daysAgo),
    })),
  });

  // Donation packages + donations (unitPrice copied from the package, total = Σ quantity × unitPrice)
  const createdPackages = await prisma.donationPackage.createManyAndReturn({
    data: donationPackages.map(({ key: _key, ...pkg }) => pkg),
    select: { id: true, name: true, price: true },
  });
  const packageByName = new Map(createdPackages.map((p) => [p.name, p]));
  const packageByKey = new Map(donationPackages.map((p) => [p.key, lookup(packageByName, p.name, "package")]));

  for (const [index, d] of donations.entries()) {
    const items = d.items.map((item) => {
      const pkg = lookup(packageByKey, item.package, "package");
      return { packageId: pkg.id, quantity: item.quantity, unitPrice: pkg.price };
    });
    await prisma.donation.create({
      data: {
        userId: lookup(userId, d.user, "user"),
        total: items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
        slipUrl: `https://picsum.photos/seed/slip-${index + 1}/600/900`,
        status: d.status,
        createdAt: daysAgo(d.daysAgo),
        items: { create: items },
      },
    });
  }

  const counts = {
    User: await prisma.user.count(),
    Animal: await prisma.animal.count(),
    AdoptionRequest: await prisma.adoptionRequest.count(),
    Favorite: await prisma.favorite.count(),
    AnimalUpdate: await prisma.animalUpdate.count(),
    Report: await prisma.report.count(),
    DonationPackage: await prisma.donationPackage.count(),
    Donation: await prisma.donation.count(),
    DonationItem: await prisma.donationItem.count(),
  };
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  console.table(counts);
  console.log(`Seeded ${total} records.`);
  console.log(`Test accounts: ${users.map((u) => u.email).join(", ")} (password: ${SEED_PASSWORD})`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
