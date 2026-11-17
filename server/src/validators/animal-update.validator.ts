import { z } from "zod";
import { bodySchema, idFromUrl, idInBody, imageUrlsField, paginationQuery, textField } from "./common";

export const MAX_UPDATE_IMAGES = 4;

const captionField = textField("Caption", 1000);
const updateImagesField = imageUrlsField(1, MAX_UPDATE_IMAGES);

/** POST /api/animal-updates */
export const createAnimalUpdateSchema = bodySchema({
  animalId: idInBody("animalId"),
  caption: captionField,
  imageUrls: updateImagesField,
});

/** PATCH /api/animal-updates/:id */
export const editAnimalUpdateSchema = bodySchema({ caption: captionField, imageUrls: updateImagesField })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { error: "Send caption and/or imageUrls to update" });

/** GET /api/animal-updates?animalId=&page=&pageSize= */
export const listAnimalUpdatesQuerySchema = z.object({
  animalId: idFromUrl("animalId").optional(),
  ...paginationQuery,
});
