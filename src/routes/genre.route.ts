import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createGenre,
  getGenres,
  getGenreById,
  updateGenre,
  deleteGenre,
} from "../controllers/genre.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", createGenre);
router.get("/", getGenres);
router.get("/:id", getGenreById);
router.patch("/:id", updateGenre);
router.delete("/:id", deleteGenre);

export default router;
