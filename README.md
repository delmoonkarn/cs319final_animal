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

The seed also creates 40 animals (7 adopted, 5 pending, 28 available; 7 urgent), 15 adoption requests,
21 favorites, 20 success-story updates, 8 community reports, 6 donation packages and 5 donations with
9 items (130 records in total; the seed refuses to run with fewer than 40).

Animal photos are the `imageUrls` links in `server/prisma/seed-data.ts` (1–5 per animal, first = cover):
free-licensed photos from Wikimedia Commons, credited in `server/prisma/photo-credits.md`. To check
them, run `npm run photos:preview` and open the generated `server/seed-photos.html` in a browser.
Success-story, report and slip images in the seed are still random placeholders (picsum.photos).
Database ids are not reset between seeds, so log in again after re-seeding (animal ids change too).

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

### Animals

| Method | Path | Auth | Response |
| --- | --- | --- | --- |
| GET | `/animals` | – | `200 { data: AnimalListItem[], pagination }` |
| GET | `/animals/:id` | – | `200 AnimalDetail` |
| POST | `/animals` | admin | `201 AnimalDetail` |
| PATCH | `/animals/:id` | admin | `200 AnimalDetail` |
| DELETE | `/animals/:id` | admin | `204` (no body) |

**List query parameters** (all optional):

| Param | Values | Default |
| --- | --- | --- |
| `species` | `DOG` / `CAT` / `OTHER` | – |
| `status` | `AVAILABLE` / `PENDING` / `ADOPTED` | – |
| `gender` | `MALE` / `FEMALE` / `UNKNOWN` | – |
| `isUrgent`, `isVaccinated` | `true` / `false` | – |
| `q` | search text (name, breed, location) | – |
| `sort` | `newest` / `oldest` / `urgent` / `name` | `newest` |
| `page`, `pageSize` | numbers (`pageSize` max 50) | `1`, `12` |

Example: `GET /animals?species=CAT&isUrgent=true&q=บางนา&page=1&pageSize=12`

```jsonc
// AnimalListItem (cards)
{ "id": 3, "name": "โมจิ", "species": "DOG", "breed": "ปอมเมอเรเนียนผสม", "gender": "FEMALE",
  "ageMonths": 24, "isVaccinated": true, "isUrgent": false, "status": "PENDING",
  "locationFound": "…", "adoptedAt": null, "createdAt": "2026-…",
  "coverImage": { "url": "…", "thumbUrl": "…" } }

// pagination
{ "page": 1, "pageSize": 12, "total": 42, "totalPages": 4 }

// AnimalDetail = every animal field (incl. personality, healthNote, updatedAt) plus:
{ "images": [{ "url": "…", "thumbUrl": "…" }],            // first = cover
  "favoriteCount": 1,
  "updates": [{ "id": 1, "caption": "…", "createdAt": "…",  // success stories, oldest first
                "images": [{ "url": "…", "thumbUrl": "…" }],
                "author": { "id": 1, "name": "…", "role": "ADMIN" } }] }
```

**Create body** (PATCH takes any subset of the same fields):

```json
{
  "name": "มะม่วง", "species": "CAT", "breed": "แมวไทยพันทาง", "gender": "FEMALE",
  "ageMonths": 7, "personality": "ขี้เล่น", "healthNote": "ทำหมันแล้ว",
  "isVaccinated": true, "isUrgent": false,
  "imageUrls": ["<url from POST /uploads>", "…"],
  "locationFound": "ซอยอารีย์ เขตพญาไท"
}
```

- `imageUrls`: 1–5 URLs from `POST /uploads`, first one = cover. `isVaccinated` / `isUrgent` default to `false`.
- `status` and `adoptedAt` can't be set here: new animals start `AVAILABLE`, and adoption requests
  move them to `PENDING` / `ADOPTED`.
- PATCH with a new `imageUrls` list deletes the photos you removed from Storage.
- DELETE also removes the animal's adoption requests, favorites, success stories and all their
  photos. A report it was created from is kept (unlinked).
- Animal responses already include `thumbUrl` for every image.
- Response types: `server/src/lib/animal-dto.ts` and `server/src/types/api.ts`.

### Adoption requests

| Method | Path | Auth | Body / query | Response |
| --- | --- | --- | --- | --- |
| POST | `/adoption-requests` | user | `{ animalId, reason, housingType }` | `201 MyAdoptionRequest` |
| GET | `/adoption-requests/me` | user | `?status=` (optional) | `200 MyAdoptionRequest[]` (newest first) |
| DELETE | `/adoption-requests/:id` | user (own, PENDING only) | – | `204` |
| GET | `/adoption-requests` | admin | `?status=&animalId=&page=&pageSize=` | `200 { data: AdminAdoptionRequest[], pagination }` |
| PATCH | `/adoption-requests/:id` | admin | `{ "status": "APPROVED" }` or `"REJECTED"` | `200 AdminAdoptionRequest` |

```jsonc
// MyAdoptionRequest
{ "id": 16, "reason": "…", "housingType": "CONDO", "status": "PENDING", "createdAt": "…",
  "animal": { /* AnimalListItem, with its current status */ } }

// AdminAdoptionRequest = MyAdoptionRequest + the applicant's contact details
{ …, "user": { "id": 2, "name": "สมชาย ใจดี", "email": "user1@test.com", "phone": "0811111111" } }
```

How the animal's status follows the requests (all handled by the server):

| Event | Request | Animal |
| --- | --- | --- |
| First request on an `AVAILABLE` animal | `PENDING` | → `PENDING` |
| Admin approves | → `APPROVED` | → `ADOPTED` (+ `adoptedAt`); every other pending request for it → `REJECTED` |
| Admin rejects, or the user cancels, and no pending request is left | → `REJECTED` / deleted | → `AVAILABLE` |

- `housingType`: `HOUSE` / `CONDO` / `DORM`. Only `USER` accounts can apply (admins get 403).
- 409 errors: the animal is already adopted, the user already applied for it (one request per user
  per animal, even after a rejection), or the request was already approved/rejected.
- Changes for the same animal run one at a time (database transaction + row lock), so an animal can
  never be approved for two people.
- Response types: `server/src/lib/adoption-request-dto.ts`.

### Favorites (wishlist)

| Method | Path | Auth | Response |
| --- | --- | --- | --- |
| GET | `/favorites` | user | `200 FavoriteDto[]` (most recently added first) |
| PUT | `/favorites/:animalId` | user | `204` — add (adding twice is fine) |
| DELETE | `/favorites/:animalId` | user | `204` — remove (fine if it wasn't there) |

```jsonc
// FavoriteDto
{ "animalId": 7, "createdAt": "…", "animal": { /* AnimalListItem */ } }
```

For heart icons: load `GET /favorites` once and check `animalId`s. Toggling never errors, so the
button can just call PUT or DELETE. `AnimalDetail.favoriteCount` shows how many users saved it.
Response type: `server/src/lib/favorite-dto.ts`.

### Success stories (animal updates)

| Method | Path | Auth | Body / query | Response |
| --- | --- | --- | --- | --- |
| GET | `/animal-updates` | – | `?animalId=&page=&pageSize=` | `200 { data: AnimalUpdateItem[], pagination }` (newest first) |
| POST | `/animal-updates` | admin or the animal's adopter | `{ animalId, caption, imageUrls }` | `201 AnimalUpdateItem` |
| PATCH | `/animal-updates/:id` | author or admin | `{ caption?, imageUrls? }` | `200 AnimalUpdateItem` |
| DELETE | `/animal-updates/:id` | author or admin | – | `204` |

```jsonc
// AnimalUpdateItem
{ "id": 18, "caption": "…", "createdAt": "…", "images": [{ "url": "…", "thumbUrl": "…" }],
  "author": { "id": 2, "name": "สมชาย ใจดี", "role": "USER" },
  "animal": { /* AnimalListItem */ } }
```

- Only for `ADOPTED` animals (409 otherwise). The adopter = the user whose request was approved.
- `imageUrls`: 1–4. Photos removed by PATCH, and all photos on DELETE, are deleted from Storage.
- `AnimalDetail.updates` also lists an animal's stories (oldest first) for its timeline.

### Reports (found / injured animals)

| Method | Path | Auth | Body / query | Response |
| --- | --- | --- | --- | --- |
| POST | `/reports` | user | `{ species, breed?, imageUrls, location, description }` | `201 MyReport` |
| GET | `/reports/me` | user | – | `200 MyReport[]` (newest first) |
| GET | `/reports/:id` | reporter or admin | – | `200 MyReport` / `AdminReport` |
| DELETE | `/reports/:id` | reporter (PENDING only) or admin | – | `204` |
| GET | `/reports` | admin | `?status=&species=&page=&pageSize=` | `200 { data: AdminReport[], pagination }` |
| PATCH | `/reports/:id` | admin | see below | `200 AdminReport` |

```jsonc
// MyReport
{ "id": 9, "species": "DOG", "breed": null, "location": "…", "description": "…", "status": "PENDING",
  "createdAt": "…", "images": [{ "url": "…", "thumbUrl": "…" }],
  "animal": null }            // { id, name, status } once approved
// AdminReport = MyReport + "reporter": { id, name, email, phone }
```

Reviewing (admin):

```jsonc
{ "status": "REJECTED" }      // photos are deleted from Storage, images become []

{ "status": "APPROVED",       // creates an AVAILABLE animal from the report and links it
  "animal": { "name": "แม่ส้ม", "gender": "FEMALE", "ageMonths": 24,
              "personality": "…", "healthNote": "…",
              // optional — taken from the report when left out:
              "breed": "…", "locationFound": "…", "imageUrls": ["…"],
              "isVaccinated": false, "isUrgent": true } }
```

- `imageUrls`: 1–3. `breed` is optional when reporting; it's required when approving if the report has none.
- The new animal's species, photos and location come from the report. Those photos stay shared:
  editing or deleting the animal never deletes photos the report still shows.
- 409: the report was already reviewed (only one admin can approve it).

### Donations

**Packages**

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| GET | `/donation-packages` | – | – | `200 DonationPackage[]` (cheapest first) |
| POST | `/donation-packages` | admin | `{ name, description, price, icon }` | `201 DonationPackage` |
| PATCH | `/donation-packages/:id` | admin | any of those fields | `200 DonationPackage` |
| DELETE | `/donation-packages/:id` | admin | – | `204` (409 if already used in donations) |

`DonationPackage` = `{ id, name, description, price, icon }` — `price` in THB (whole baht), `icon` e.g. `"🍖"`.

**Donations**

| Method | Path | Auth | Body / query | Response |
| --- | --- | --- | --- | --- |
| GET | `/donations/summary` | – | – | `200 { totalConfirmed, confirmedCount }` |
| POST | `/donations` | user | `{ items: [{ packageId, quantity }], slipUrl }` | `201 MyDonation` |
| GET | `/donations/me` | user | – | `200 MyDonation[]` (newest first) |
| DELETE | `/donations/:id` | donor (PENDING only) or admin | – | `204` |
| GET | `/donations` | admin | `?status=&page=&pageSize=` | `200 { data: AdminDonation[], pagination }` |
| PATCH | `/donations/:id` | admin | `{ "status": "CONFIRMED" }` (or `"PENDING"`) | `200 AdminDonation` |

```jsonc
// MyDonation (the receipt)
{ "id": 6, "total": 500, "status": "PENDING", "createdAt": "…",
  "slip": { "url": "…", "thumbUrl": "…" },
  "items": [ { "id": 10, "quantity": 2, "unitPrice": 100, "subtotal": 200,
               "package": { "id": 1, "name": "ค่าอาหาร 1 สัปดาห์", "icon": "🍖" } } ] }
// AdminDonation = MyDonation + "user": { id, name, email, phone }
```

- Flow: upload the slip photo (`POST /uploads`) → `POST /donations` with its `url` as `slipUrl`.
- The server takes each `unitPrice` from the package and calculates `total` itself; prices sent by the
  client are ignored. Later package price changes don't change past donations.
- `quantity`: 1–99; each package at most once per donation. New donations are `PENDING` until an
  admin confirms the slip. Deleting a donation also deletes its slip photo.
- Slips are in the public bucket: anyone with the exact (random) link can open them.

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
