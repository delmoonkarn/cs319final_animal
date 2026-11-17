import { randomUUID } from "node:crypto";
import { env } from "./env";
import type { ProcessedImage } from "./image";
import { supabase } from "./supabase";

/**
 * Image storage on Supabase Storage (public bucket).
 *
 * Every upload produces two files with the same name:
 *   <yyyy>/<mm>/<uuid>.webp        full size  → its URL is what the database stores
 *   <yyyy>/<mm>/<uuid>_thumb.webp  thumbnail  → URL derived with toThumbUrl(), never stored
 */

const THUMB_SUFFIX = "_thumb";
const ONE_YEAR_SECONDS = "31536000"; // file names are unique, so browsers/CDN can cache forever

const bucket = () => supabase.storage.from(env.SUPABASE_BUCKET);

/** e.g. https://<project>.supabase.co/storage/v1/object/public/<bucket>/ */
const publicUrlPrefix = bucket().getPublicUrl("").data.publicUrl;

export type UploadedImage = { url: string; thumbUrl: string };

function newObjectPath(): string {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${now.getUTCFullYear()}/${month}/${randomUUID()}.webp`;
}

function toThumbPath(path: string): string {
  return path.replace(/\.webp$/, `${THUMB_SUFFIX}.webp`);
}

function toPublicUrl(path: string): string {
  return bucket().getPublicUrl(path).data.publicUrl;
}

/** Storage path of the full-size file behind a URL of ours, or null for any other URL. */
function toStoragePath(url: string): string | null {
  if (!url.startsWith(publicUrlPrefix)) {
    return null;
  }
  const path = decodeURI(url.slice(publicUrlPrefix.length).split(/[?#]/)[0]);
  return path.replace(new RegExp(`${THUMB_SUFFIX}\\.webp$`), ".webp");
}

/**
 * Thumbnail URL for a stored image URL (same path + "_thumb").
 * URLs that aren't from our bucket (e.g. seed placeholders) are returned unchanged.
 */
export function toThumbUrl(url: string): string {
  const path = toStoragePath(url);
  return path ? toPublicUrl(toThumbPath(path)) : url;
}

async function putObject(path: string, body: Buffer): Promise<void> {
  const { error } = await bucket().upload(path, body, {
    contentType: "image/webp",
    cacheControl: ONE_YEAR_SECONDS,
    upsert: false,
  });
  if (error) {
    throw new Error(`Supabase Storage upload of "${path}" failed: ${error.message}`);
  }
}

/** Uploads the full-size and thumbnail files of one processed image. */
export async function uploadImage(image: ProcessedImage): Promise<UploadedImage> {
  const path = newObjectPath();
  const thumbPath = toThumbPath(path);

  await putObject(path, image.full);
  try {
    await putObject(thumbPath, image.thumb);
  } catch (error) {
    await bucket().remove([path]);
    throw error;
  }

  return { url: toPublicUrl(path), thumbUrl: toPublicUrl(thumbPath) };
}

/**
 * Deletes the full-size AND thumbnail files behind the given image URLs
 * (e.g. when an animal is deleted or a report is rejected).
 *
 * URLs that aren't from our bucket (seed placeholders, external links) are skipped.
 * Best-effort: a Storage failure is logged, not thrown, so it never blocks a database delete.
 * Returns the storage paths that were actually removed.
 */
export async function deleteImages(urls: readonly string[]): Promise<string[]> {
  const paths = new Set<string>();
  for (const url of urls) {
    const path = toStoragePath(url);
    if (path) {
      paths.add(path);
      paths.add(toThumbPath(path));
    }
  }
  if (paths.size === 0) {
    return [];
  }

  const { data, error } = await bucket().remove([...paths]);
  if (error) {
    console.error(`[storage] Could not delete ${paths.size} file(s): ${error.message}`);
    return [];
  }
  return data.map((file) => file.name);
}
