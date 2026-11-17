import { Router } from "express";
import { addFavorite, listFavorites, removeFavorite } from "../controllers/favorite.controller";
import { requireAuth } from "../middlewares/auth";

export const favoriteRouter = Router();

favoriteRouter.get("/", requireAuth, listFavorites);
favoriteRouter.put("/:animalId", requireAuth, addFavorite);
favoriteRouter.delete("/:animalId", requireAuth, removeFavorite);
