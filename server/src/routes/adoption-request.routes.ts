import { Router } from "express";
import {
  cancelAdoptionRequest,
  createAdoptionRequest,
  listAdoptionRequests,
  listMyAdoptionRequests,
  reviewAdoptionRequest,
} from "../controllers/adoption-request.controller";
import { requireAdmin, requireAuth } from "../middlewares/auth";

export const adoptionRequestRouter = Router();

// Users
adoptionRequestRouter.post("/", requireAuth, createAdoptionRequest);
adoptionRequestRouter.get("/me", requireAuth, listMyAdoptionRequests);
adoptionRequestRouter.delete("/:id", requireAuth, cancelAdoptionRequest);

// Admin
adoptionRequestRouter.get("/", requireAdmin, listAdoptionRequests);
adoptionRequestRouter.patch("/:id", requireAdmin, reviewAdoptionRequest);
