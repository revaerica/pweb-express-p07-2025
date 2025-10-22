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

router.post("/", createTransaction);
router.get("/", getTransactions);
router.get("/:id", getTransactionById);
router.get("/statistics", getStatistics);

export default router;
