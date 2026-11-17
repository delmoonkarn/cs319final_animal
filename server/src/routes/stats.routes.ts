import { Router } from "express";
import { getAdminStats, getStats } from "../controllers/stats.controller";
import { requireAdmin } from "../middlewares/auth";

export const statsRouter = Router();

statsRouter.get("/", getStats);
statsRouter.get("/admin", requireAdmin, getAdminStats);
