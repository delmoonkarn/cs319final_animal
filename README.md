# ระบบช่วยหาบ้านให้สัตว์จรจัดในชุมชน

Community stray-animal adoption web app. People can browse stray animals that need a home, request
to adopt, keep a wishlist, follow success stories of adopted animals, report found or injured animals,
and donate to care packages.

```
project/
├── client/   Frontend: React + Vite + TypeScript
└── server/   Backend: Express + TypeScript + Prisma 7 (PostgreSQL on Supabase)
    ├── prisma.config.ts Prisma CLI config: schema path, migrations, seed command, DIRECT_URL
    ├── prisma/          schema.prisma, migrations/, seed.ts, seed-data.ts
    └── src/
        ├── index.ts     Express app (CORS, JSON, routes, 404 + error handler)
        ├── lib/         prisma (client + pg driver adapter), supabase, env, jwt, password, image, storage
        ├── routes/      URL → controller mapping (mounted under /api)
        ├── controllers/ request handlers
        ├── middlewares/ requireAuth / requireAdmin, multer upload, error handler
        ├── validators/  zod schemas for request bodies
        └── types/       Express Request typing (req.user)
```

## Server setup

Requires **Node.js 22.12+**.

How the server reaches the database (Prisma 7):

- `DATABASE_URL` (transaction pooler, port 6543) — used by the running server and the seed, through
  the `@prisma/adapter-pg` driver adapter (`src/lib/prisma.ts`).
- `DIRECT_URL` (session pooler, port 5432) — used by Prisma Migrate, set in `prisma.config.ts`.
- Neither URL is written in `schema.prisma`; Prisma 7 reads them from those two files.

### 1. Supabase (one-time)

1. Create a project (region: Southeast Asia / Singapore is closest to Thailand).
2. **Database:** click **Connect → ORMs → Prisma** and copy the two connection strings into
   `DATABASE_URL` (port 6543, `?pgbouncer=true`) and `DIRECT_URL` (port 5432).
3. **Storage:** Storage → **New bucket**
   - Name: `uploads` (must match `SUPABASE_BUCKET`)
   - **Public bucket: ON** (images are read by URL; only the server can write)
   - Optional but recommended: file size limit `5 MB`, allowed MIME types `image/webp`
     (the server converts every upload to WebP)
   - No storage policies are needed: the server uses the secret key, and anonymous clients
     should not be able to upload.
4. **API keys:** Project Settings → API Keys → copy the **secret** key (`sb_secret_…`, or the legacy
   `service_role` key) into `SUPABASE_SERVICE_ROLE_KEY`. It stays on the server only.

> Free plan: 500 MB database, 1 GB storage, 5 GB bandwidth, no image transformations — which is why
> the server compresses images itself. Free projects pause after a week without activity.

### 2. Environment

```bash
cd server
cp .env.example .env
```

Fill in `.env`. Generate `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Install, migrate, seed, run

```bash
npm install          # also runs `prisma generate`
npm run db:deploy    # applies the committed migrations in prisma/migrations
npm run db:seed      # clears all tables and inserts the sample data
npm run dev          # http://localhost:3000/api/health
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the API with auto-reload (`tsx watch`) |
| `npm run build` / `npm start` | Compile to `dist/` / run the compiled server |
| `npm run typecheck` | Type-check `src/` and `prisma/` without emitting |
| `npm run db:migrate` | `prisma migrate dev` — after editing `schema.prisma`, create + apply a new migration: `npm run db:migrate -- --name <change>` |
| `npm run db:deploy` | `prisma migrate deploy` — apply committed migrations (first setup, teammates, production) |
| `npm run db:seed` | Re-runnable seed (wipes and refills every table) |
| `npm run db:studio` | Browse the database in Prisma Studio |

## Seeded test accounts

All seeded accounts use the password **`password123`**.

| Role | Email | Name |
| --- | --- | --- |
| ADMIN | `admin@test.com` | ผู้ดูแลระบบ |
| USER | `user1@test.com` | สมชาย ใจดี |
| USER | `user2@test.com` | สุดารัตน์ รักสัตว์ |
| USER | `user3@test.com` | วิทยา ศรีสุข |
| USER | `user4@test.com` | นภัสสร พงษ์ไทย |
| USER | `user5@test.com` | ธนพล แก้วมณี |

The seed also creates 42 animals (7 adopted, 5 pending, 30 available; 7 urgent), 15 adoption requests,
15 favorites, 20 success-story updates, 8 community reports, 6 donation packages and 5 donations with
9 items (126 records in total). Seed images are external placeholders (picsum.photos), not files in Storage.
Database ids are not reset between seeds, so log in again after re-seeding.

## API

Base URL: `http://localhost:3000/api`. Requests and responses are JSON (except uploads).
Protected routes need the header `Authorization: Bearer <token>`.

Every error has the shape `{ "message": "..." }`; validation errors (400) also include
`errors: [{ field, message }]`.

| Status | When |
| --- | --- |
| 400 | Invalid body (zod), bad upload (type, size, count), malformed JSON |
| 401 | Missing/invalid/expired token, wrong email or password |
| 403 | Logged in but not an admin |
| 404 | Unknown route or record |
| 409 | Duplicate unique value (e.g. email already registered) |
| 500 | Unexpected server error (details are only logged on the server) |

### Auth

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | – | `{ name, email, phone, password }` | `201 { token, user }` |
| POST | `/auth/login` | – | `{ email, password }` | `200 { token, user }` |
| GET | `/auth/me` | user | – | `200 { user }` |

- Register always creates a `USER`. Password: at least 8 characters. Phone: Thai number, e.g. `0812345678`.
- `user` is `{ id, name, email, phone, role, createdAt }` — the password hash is never returned.
- The token payload is `{ userId, role }` and expires after `JWT_EXPIRES_IN` (default 7 days).

### Uploads

`POST /uploads` (logged-in users) — `multipart/form-data` with 1–5 files in the field **`images`**.
JPG, PNG or WEBP, max 5 MB each.

Each image is compressed on the server into two WebP files and the response lists them in order:

```json
[{ "url": "https://…/uploads/2026/11/<uuid>.webp", "thumbUrl": "https://…/uploads/2026/11/<uuid>_thumb.webp" }]
```

- `url`: max 1200 px wide → **store only this in the database** (e.g. in `imageUrls`).
- `thumbUrl`: 400 px wide, for cards and lists. It is never stored; derive it from `url` by inserting
  `_thumb` before `.webp`. Seed placeholder URLs have no thumbnail, so use them as they are:

```ts
const thumb = (url: string) => (url.endsWith(".webp") ? url.replace(/\.webp$/, "_thumb.webp") : url);
```

Typical flow: upload images first → send the returned `url`s in the create request
(animal, report, update or donation slip).

### Health

`GET /health` → `{ "status": "ok", "time": "…" }`

## Database

Nine tables, all with `id` (auto-increment) primary keys:

| Table | Notes |
| --- | --- |
| `User` | `email` unique; `role` USER / ADMIN |
| `Animal` | `species` DOG / CAT / OTHER; `status` AVAILABLE / PENDING / ADOPTED; 1–5 `imageUrls` (first is the cover); indexes on `status`, `species`, `isUrgent` |
| `AdoptionRequest` | user → animal, `housingType` HOUSE / CONDO / DORM, `status` PENDING / APPROVED / REJECTED; unique `(userId, animalId)` |
| `Favorite` | wishlist; unique `(userId, animalId)` |
| `AnimalUpdate` | success-story timeline of an adopted animal, written by an admin or the adopter; 1–4 images |
| `Report` | community report of a found/injured animal; 1–3 images; `animalId` (unique, nullable) links an approved report to the animal created from it |
| `DonationPackage` | e.g. food 100฿, vaccine 300฿, medicine 500฿, sterilization 1500฿ |
| `Donation` | `total` in THB, one `slipUrl`, `status` PENDING / CONFIRMED |
| `DonationItem` | receipt line: `quantity` × `unitPrice` (copied from the package at checkout); unique `(donationId, packageId)` |

Deleting an animal also deletes its adoption requests, favorites and updates (its report is kept and
unlinked); deleting a donation deletes its items. Image counts are enforced by zod in the API.
