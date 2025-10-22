import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma";
import { response } from "../utils/response";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";

/**
 * VALIDATION SCHEMAS
 */
const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  username: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(1, { message: "Password is required" }),
});

/**
 * @desc Register new user
 * @route POST /auth/register
 */
export const register = async (req: Request, res: Response) => {
  try {
    // ✅ Validasi input pakai zod
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return res
        .status(400)
        .json(response(false, "Validation error", { errors: fieldErrors }));
    }

    const { email, password, username } = parsed.data;

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json(response(false, "Email already registered"));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan ke database
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    });

    return res.status(201).json(
      response(true, "User registered successfully", {
        id: user.id,
        email: user.email,
        username: user.username,
        created_at: user.created_at,
      })
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json(response(false, "Internal server error"));
  }
};

/**
 * @desc Login user
 * @route POST /auth/login
 */
export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
    return res
        .status(400)
        .json(response(false, "Validation error", { errors: fieldErrors }));
    }

    const { email, password } = parsed.data;

    // Cek user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json(response(false, "Invalid email or password"));
    }

    // Cek password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json(response(false, "Invalid email or password"));
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.status(200).json(
      response(true, "Login successful", {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      })
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json(response(false, "Internal server error"));
  }
};

/**
 * @desc Get current user profile
 * @route GET /auth/me
 */
export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json(response(false, "Unauthorized"));
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json(response(false, "User not found"));
    }

    return res.status(200).json(
      response(true, "Profile fetched successfully", {
        id: user.id,
        email: user.email,
        username: user.username,
        created_at: user.created_at,
      })
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json(response(false, "Internal server error"));
  }
};
