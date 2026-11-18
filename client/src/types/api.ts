// Shapes returned by the server API (see the API section of the README).

export type Role = 'USER' | 'ADMIN';

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  createdAt: string;
};

/** POST /auth/login and POST /auth/register */
export type AuthResponse = { token: string; user: User };

/** Every error response: { message }, plus field errors for 400 validation errors. */
export type ApiErrorBody = {
  message: string;
  errors?: { field: string; message: string }[];
};

export type Pagination = { page: number; pageSize: number; total: number; totalPages: number };

/** List endpoints: { data: [...], pagination } */
export type Paginated<T> = { data: T[]; pagination: Pagination };

/** A photo: full-size url (what the database stores) + a 400px thumbnail. */
export type ImageDto = { url: string; thumbUrl: string };

export type Species = 'DOG' | 'CAT' | 'OTHER';
export type Gender = 'MALE' | 'FEMALE' | 'UNKNOWN';
export type AnimalStatus = 'AVAILABLE' | 'ADOPTED';

/** GET /animals (cards and tables) */
export type AnimalListItem = {
  id: number;
  name: string;
  species: Species;
  breed: string;
  gender: Gender;
  ageMonths: number;
  personality: string[];
  isVaccinated: boolean;
  isSterilized: boolean;
  isUrgent: boolean;
  status: AnimalStatus;
  locationFound: string;
  province: string;
  adoptedAt: string | null;
  createdAt: string;
  coverImage: ImageDto | null;
};

/** GET /animals/:id */
export type AnimalDetail = Omit<AnimalListItem, 'coverImage'> & {
  description: string;
  /** Health history, one entry per line */
  healthNote: string;
  updatedAt: string;
  /** All photos in order; the first is the cover */
  images: ImageDto[];
  favoriteCount: number;
  requestCount: number;
  updates: {
    id: number;
    caption: string;
    createdAt: string;
    images: ImageDto[];
    author: { id: number; name: string; role: Role };
  }[];
};

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** GET /reports (admin): a community report of a found / injured animal */
export type AdminReport = {
  id: number;
  species: Species;
  breed: string | null;
  location: string;
  description: string;
  status: ReviewStatus;
  createdAt: string;
  images: ImageDto[];
  /** The animal listing created when the report was approved */
  animal: { id: number; name: string; status: AnimalStatus } | null;
  reporter: { id: number; name: string; email: string; phone: string };
};

export type HousingType = 'HOUSE' | 'CONDO' | 'DORM';

/** GET /adoption-requests (admin): someone's request to adopt an animal */
export type AdminAdoptionRequest = {
  id: number;
  reason: string;
  housingType: HousingType;
  status: ReviewStatus;
  createdAt: string;
  animal: AnimalListItem;
  user: { id: number; name: string; email: string; phone: string };
};

/** Body of POST /animals and PATCH /animals/:id */
export type AnimalPayload = {
  name: string;
  species: Species;
  breed: string;
  gender: Gender;
  ageMonths: number;
  personality: string[];
  description: string;
  healthNote: string;
  isVaccinated: boolean;
  isSterilized: boolean;
  isUrgent: boolean;
  imageUrls: string[];
  locationFound: string;
  province: string;
  status: AnimalStatus;
};

/** `animal` in PATCH /reports/:id { status: "APPROVED", animal } — species comes from the report, status is AVAILABLE */
export type ReportAnimalPayload = Omit<AnimalPayload, 'species' | 'status'>;
