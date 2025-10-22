import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  getStatistics,
} from "../controllers/transactions.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", authMiddleware, createTransaction);
router.get("/", authMiddleware, getTransactions);
router.get("/statistics", authMiddleware, getStatistics);
router.get("/:id", authMiddleware, getTransactionById);

export default router;
