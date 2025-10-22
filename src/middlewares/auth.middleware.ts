import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { response } from "../utils/response";

const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json(response(false, "No token provided"));
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    (req as any).user = decoded;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json(response(false, "Invalid or expired token"));
  }
};
