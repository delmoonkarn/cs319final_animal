import { z } from "zod";
import { idFromUrl } from "./common";

/** PUT / DELETE /api/favorites/:animalId */
export const favoriteParamSchema = z.object({ animalId: idFromUrl("animalId") });
