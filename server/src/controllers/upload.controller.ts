import type { Request, Response } from "express";
import { HttpError } from "../lib/http-error";
import { processImage, type ProcessedImage } from "../lib/image";
import { deleteImages, uploadImage, type UploadedImage } from "../lib/storage";
import { MAX_FILES_PER_REQUEST, UPLOAD_FIELD_NAME } from "../middlewares/upload";

/**
 * POST /api/uploads (multipart/form-data, field "images", 1–5 files)
 * → 201 [{ url, thumbUrl }, ...] in the same order as the files.
 * Store only `url` in the database; the thumbnail is derived with toThumbUrl().
 */
export async function uploadImagesController(req: Request, res: Response): Promise<void> {
  const files = Array.isArray(req.files) ? req.files : [];
  if (files.length === 0) {
    throw new HttpError(400, `Attach 1-${MAX_FILES_PER_REQUEST} images in the "${UPLOAD_FIELD_NAME}" field`);
  }

  // Process every file first, so one bad file rejects the request before anything is stored.
  const processed: ProcessedImage[] = [];
  for (const file of files) {
    processed.push(await processImage(file.buffer, file.originalname));
  }

  const uploaded: UploadedImage[] = [];
  try {
    for (const image of processed) {
      uploaded.push(await uploadImage(image));
    }
  } catch (error) {
    // Don't leave half of a request's images orphaned in Storage.
    await deleteImages(uploaded.map((image) => image.url));
    throw error;
  }

  res.status(201).json(uploaded);
}
