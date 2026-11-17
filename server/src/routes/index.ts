import { Router } from "express";
import { animalRouter } from "./animal.routes";
import { authRouter } from "./auth.routes";
import { uploadRouter } from "./upload.routes";

/** Everything mounted under /api. Add new feature routers here. */
export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/uploads", uploadRouter);
apiRouter.use("/animals", animalRouter);
