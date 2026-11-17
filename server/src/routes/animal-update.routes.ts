import { Router } from "express";
import {
  createAnimalUpdate,
  deleteAnimalUpdate,
  editAnimalUpdate,
  listAnimalUpdates,
} from "../controllers/animal-update.controller";
import { requireAuth } from "../middlewares/auth";

export const animalUpdateRouter = Router();

animalUpdateRouter.get("/", listAnimalUpdates);
// Permission (admin / adopter / author) is checked in the controller.
animalUpdateRouter.post("/", requireAuth, createAnimalUpdate);
animalUpdateRouter.patch("/:id", requireAuth, editAnimalUpdate);
animalUpdateRouter.delete("/:id", requireAuth, deleteAnimalUpdate);
