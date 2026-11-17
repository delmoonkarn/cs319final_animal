import { Router } from "express";
import {
  createAnimal,
  deleteAnimal,
  getAnimal,
  listAnimals,
  updateAnimal,
} from "../controllers/animal.controller";
import { requireAdmin } from "../middlewares/auth";

export const animalRouter = Router();

animalRouter.get("/", listAnimals);
animalRouter.get("/:id", getAnimal);
animalRouter.post("/", requireAdmin, createAnimal);
animalRouter.patch("/:id", requireAdmin, updateAnimal);
animalRouter.delete("/:id", requireAdmin, deleteAnimal);
