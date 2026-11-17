import { Router } from "express";
import { THAI_PROVINCES } from "../lib/provinces";
import { adoptionRequestRouter } from "./adoption-request.routes";
import { animalUpdateRouter } from "./animal-update.routes";
import { animalRouter } from "./animal.routes";
import { authRouter } from "./auth.routes";
import { donationPackageRouter, donationRouter } from "./donation.routes";
import { favoriteRouter } from "./favorite.routes";
import { reportRouter } from "./report.routes";
import { statsRouter } from "./stats.routes";
import { uploadRouter } from "./upload.routes";

/** Everything mounted under /api. Add new feature routers here. */
export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

/** The 77 Thai provinces, for province dropdowns (Animal.province must be one of them). */
apiRouter.get("/provinces", (_req, res) => {
  res.json(THAI_PROVINCES);
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/uploads", uploadRouter);
apiRouter.use("/animals", animalRouter);
apiRouter.use("/adoption-requests", adoptionRequestRouter);
apiRouter.use("/favorites", favoriteRouter);
apiRouter.use("/animal-updates", animalUpdateRouter);
apiRouter.use("/reports", reportRouter);
apiRouter.use("/donation-packages", donationPackageRouter);
apiRouter.use("/donations", donationRouter);
apiRouter.use("/stats", statsRouter);
