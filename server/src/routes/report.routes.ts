import { Router } from "express";
import {
  createReport,
  deleteReport,
  getReport,
  listMyReports,
  listReports,
  reviewReport,
} from "../controllers/report.controller";
import { requireAdmin, requireAuth } from "../middlewares/auth";

export const reportRouter = Router();

// Users ("/me" must come before "/:id")
reportRouter.post("/", requireAuth, createReport);
reportRouter.get("/me", requireAuth, listMyReports);
reportRouter.get("/:id", requireAuth, getReport);
reportRouter.delete("/:id", requireAuth, deleteReport);

// Admin
reportRouter.get("/", requireAdmin, listReports);
reportRouter.patch("/:id", requireAdmin, reviewReport);
