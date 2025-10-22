import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { response } from "../utils/response";
import { z } from "zod";

// Validasi input pakai Zod
const genreSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

/**
 * @desc Create genre
 * @route POST /genre
 */
export const createGenre = async (req: Request, res: Response) => {
  try {
    const parsed = genreSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(response(false, "Validation error", parsed.error.flatten()));
    }

    const { name } = parsed.data;

    // Cek duplikat
    const existing = await prisma.genre.findUnique({ where: { name } });
    if (existing) return res.status(409).json(response(false, "Genre already exists"));

    const genre = await prisma.genre.create({ data: { name } });

    return res.status(201).json(response(true, "Genre created successfully", genre));
  } catch (error) {
    console.error(error);
    return res.status(500).json(response(false, "Internal server error"));
  }
};

/**
 * @desc Get all genres (pagination + search)
 * @route GET /genre
 */
export const getGenres = async (req: Request, res: Response) => {
  try {
    const { search, page = "1", limit = "10" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where = {
      deleted_at: null,
      name: {
        contains: search ? String(search) : undefined,
        mode: "insensitive",
      },
    };

    const [data, total] = await Promise.all([
      prisma.genre.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { name: "asc" },
      }),
      prisma.genre.count({ where }),
    ]);

    return res.status(200).json(
      response(true, "Genres fetched successfully", {
        data,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      })
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json(response(false, "Internal server error"));
  }
};

/**
 * @desc Get genre by ID
 * @route GET /genre/:id
 */
export const getGenreById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const genre = await prisma.genre.findFirst({
      where: { id, deleted_at: null },
    });

    if (!genre) return res.status(404).json(response(false, "Genre not found"));

    return res.status(200).json(response(true, "Genre fetched successfully", genre));
  } catch (error) {
    console.error(error);
    return res.status(500).json(response(false, "Internal server error"));
  }
};

/**
 * @desc Update genre
 * @route PATCH /genre/:id
 */
export const updateGenre = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = genreSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(response(false, "Validation error", parsed.error.flatten()));
    }

    const { name } = parsed.data;

    const existing = await prisma.genre.findFirst({ where: { id, deleted_at: null } });
    if (!existing) return res.status(404).json(response(false, "Genre not found"));

    const updated = await prisma.genre.update({ where: { id }, data: { name } });

    return res.status(200).json(response(true, "Genre updated successfully", updated));
  } catch (error) {
    console.error(error);
    return res.status(500).json(response(false, "Internal server error"));
  }
};

/**
 * @desc Soft delete genre
 * @route DELETE /genre/:id
 */
export const deleteGenre = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const genre = await prisma.genre.findFirst({ where: { id, deleted_at: null } });
    if (!genre) return res.status(404).json(response(false, "Genre not found"));

    await prisma.genre.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return res.status(200).json(response(true, "Genre deleted successfully"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(response(false, "Internal server error"));
  }
};
