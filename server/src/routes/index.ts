import { Router } from "express";
import { adoptionRequestRouter } from "./adoption-request.routes";
import { animalUpdateRouter } from "./animal-update.routes";
import { animalRouter } from "./animal.routes";
import { authRouter } from "./auth.routes";
import { donationPackageRouter, donationRouter } from "./donation.routes";
import { favoriteRouter } from "./favorite.routes";
import { reportRouter } from "./report.routes";
import { uploadRouter } from "./upload.routes";

/** Everything mounted under /api. Add new feature routers here. */
export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
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
