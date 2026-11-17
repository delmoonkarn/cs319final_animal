import { Router } from "express";
import { uploadImagesController } from "../controllers/upload.controller";
import { requireAuth } from "../middlewares/auth";
import { uploadImages } from "../middlewares/upload";

export const uploadRouter = Router();

// Auth runs first, so files from anonymous requests are never parsed.
uploadRouter.post("/", requireAuth, uploadImages, uploadImagesController);
