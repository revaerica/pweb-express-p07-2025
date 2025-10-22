import { Request, Response, NextFunction } from "express";
import { response } from "../utils/response";

// Global error handler — menangkap semua error dari next(err)
export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("🔥 Error caught by middleware:", err);

  // Kalau error sudah punya statusCode
  const status = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json(response(false, message, { error: err }));
};
