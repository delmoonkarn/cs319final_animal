import multer from "multer";
import { HttpError } from "../lib/http-error";

export const UPLOAD_FIELD_NAME = "images";
export const MAX_FILES_PER_REQUEST = 5;
export const MAX_FILE_SIZE_MB = 5;

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Parses multipart/form-data with up to 5 files in the "images" field, kept in memory.
 * Wrong types and oversized files are rejected while streaming, before any processing.
 * (The real file content is checked again with sharp in lib/image.ts.)
 */
export const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    files: MAX_FILES_PER_REQUEST,
    fields: 10,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new HttpError(400, `"${file.originalname}" is not a JPG, PNG or WEBP image`));
    }
  },
}).array(UPLOAD_FIELD_NAME, MAX_FILES_PER_REQUEST);
