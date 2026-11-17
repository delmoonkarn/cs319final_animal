import sharp from "sharp";
import { HttpError } from "./http-error";

const FULL_MAX_WIDTH = 1200;
const FULL_QUALITY = 75;
const THUMB_WIDTH = 400;
const THUMB_QUALITY = 70;

/** Guards against "decompression bomb" images whose tiny file expands to huge pixel counts. */
const MAX_INPUT_PIXELS = 50_000_000;
const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp"]);

export type ProcessedImage = {
  /** WebP, at most 1200px wide */
  full: Buffer;
  /** WebP, 400px wide (for cards and lists) */
  thumb: Buffer;
};

/**
 * Validates the actual file content and compresses it into a full-size and a thumbnail WebP.
 * Applies EXIF rotation; output carries no metadata (so no GPS location from phone photos).
 */
export async function processImage(input: Buffer, fileName: string): Promise<ProcessedImage> {
  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(input).metadata();
  } catch {
    throw new HttpError(400, `"${fileName}" is not a valid image file`);
  }

  if (!metadata.format || !ACCEPTED_FORMATS.has(metadata.format)) {
    throw new HttpError(400, `"${fileName}" is not a JPG, PNG or WEBP image`);
  }
  if ((metadata.width ?? 0) * (metadata.height ?? 0) > MAX_INPUT_PIXELS) {
    throw new HttpError(400, `"${fileName}" has too many pixels, please use a smaller image`);
  }

  const source = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).rotate();

  const [full, thumb] = await Promise.all([
    source
      .clone()
      .resize({ width: FULL_MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: FULL_QUALITY })
      .toBuffer(),
    source
      .clone()
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .webp({ quality: THUMB_QUALITY })
      .toBuffer(),
  ]);

  return { full, thumb };
}
