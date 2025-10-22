import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createBook,
  getBooks,
  getBookById,
  getBooksByGenre,
  updateBook,
  deleteBook,
} from "../controllers/books.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", createBook);
router.get("/", getBooks);
router.get("/genre/:genre_id", getBooksByGenre);
router.get("/:id", getBookById);
router.patch("/:id", updateBook);
router.delete("/:id", deleteBook);

export default router;
