import { Router } from "express";
import {
  createPackage,
  deletePackage,
  listPackages,
  updatePackage,
} from "../controllers/donation-package.controller";
import {
  createDonation,
  deleteDonation,
  getDonationSummary,
  listDonations,
  listMyDonations,
  reviewDonation,
} from "../controllers/donation.controller";
import { requireAdmin, requireAuth } from "../middlewares/auth";

/** /api/donation-packages */
export const donationPackageRouter = Router();

donationPackageRouter.get("/", listPackages);
donationPackageRouter.post("/", requireAdmin, createPackage);
donationPackageRouter.patch("/:id", requireAdmin, updatePackage);
donationPackageRouter.delete("/:id", requireAdmin, deletePackage);

/** /api/donations */
export const donationRouter = Router();

donationRouter.get("/summary", getDonationSummary);
donationRouter.post("/", requireAuth, createDonation);
donationRouter.get("/me", requireAuth, listMyDonations);
donationRouter.delete("/:id", requireAuth, deleteDonation);
donationRouter.get("/", requireAdmin, listDonations);
donationRouter.patch("/:id", requireAdmin, reviewDonation);
