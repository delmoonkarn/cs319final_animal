import type { Prisma } from "@prisma/client";
import type { ImageDto } from "../types/api";
import { toImageDto } from "./animal-dto";

/** Response shapes for donations (the "receipt"), and the queries that produce them. */

const donationItemSelect = {
  id: true,
  quantity: true,
  unitPrice: true,
  package: { select: { id: true, name: true, icon: true } },
} as const satisfies Prisma.DonationItemSelect;

/** What the donor sees. */
export const myDonationSelect = {
  id: true,
  total: true,
  slipUrl: true,
  status: true,
  createdAt: true,
  items: { select: donationItemSelect, orderBy: { id: "asc" } },
} as const satisfies Prisma.DonationSelect;

/** What the admin sees: the same plus the donor's contact details. */
export const adminDonationSelect = {
  ...myDonationSelect,
  user: { select: { id: true, name: true, email: true, phone: true } },
} as const satisfies Prisma.DonationSelect;

type MyDonationRow = Prisma.DonationGetPayload<{ select: typeof myDonationSelect }>;
type AdminDonationRow = Prisma.DonationGetPayload<{ select: typeof adminDonationSelect }>;
type DonationItemRow = MyDonationRow["items"][number];

/** One receipt line: quantity × unitPrice (the package price at the time of donating). */
export type DonationItemDto = DonationItemRow & { subtotal: number };

export type MyDonation = Omit<MyDonationRow, "slipUrl" | "items"> & {
  slip: ImageDto;
  items: DonationItemDto[];
};
export type AdminDonation = Omit<AdminDonationRow, "slipUrl" | "items"> & {
  slip: ImageDto;
  items: DonationItemDto[];
};

function toItems(items: DonationItemRow[]): DonationItemDto[] {
  return items.map((item) => ({ ...item, subtotal: item.quantity * item.unitPrice }));
}

export function toMyDonation({ slipUrl, items, ...donation }: MyDonationRow): MyDonation {
  return { ...donation, slip: toImageDto(slipUrl), items: toItems(items) };
}

export function toAdminDonation({ slipUrl, items, ...donation }: AdminDonationRow): AdminDonation {
  return { ...donation, slip: toImageDto(slipUrl), items: toItems(items) };
}

/** Public numbers for the homepage. */
export type DonationSummary = {
  /** Sum of all CONFIRMED donations, in THB */
  totalConfirmed: number;
  confirmedCount: number;
};
