import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { response } from "../utils/response";
import { z } from "zod";

// Skema validasi pakai Zod
const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  writer: z.string().min(1, "Writer is required"),
  publisher: z.string().min(1, "Publisher is required"),
  publication_year: z.number().int(),
  description: z.string().optional(),
  price: z.number().positive(),
  stock_quantity: z.number().int().nonnegative(),
  genre_id: z.string().uuid(),
});

/**
 * @desc Create book
 * @route POST /books
 */
export const createBook = async (req: Request, res: Response) => {
  try {
    const parsed = bookSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json(response(false, "Validation error", parsed.error.flatten()));

    const { title, writer, publisher, publication_year, description, price, stock_quantity, genre_id } =
      parsed.data;

    // Pastikan genre ada
    const genre = await prisma.genre.findFirst({ where: { id: genre_id, deleted_at: null } });
    if (!genre) return res.status(404).json(response(false, "Genre not found"));

    // Cek duplikat title
    const existing = await prisma.book.findUnique({ where: { title } });
    if (existing) return res.status(409).json(response(false, "Book title already exists"));

    const book = await prisma.book.create({
      data: { title, writer, publisher, publication_year, description, price, stock_quantity, genre_id },
    });

    return res.status(201).json(response(true, "Book created successfully", book));
  } catch (error) {
    console.error(error);
    return res.status(500).json(response(false, "Internal server error"));
  }
};

/**
 * @desc Get all books (with search, pagination, and sorting)
 * @route GET /books
 */
export const getBooks = async (req: Request, res: Response) => {
  try {
    const { search, page = "1", limit = "10", orderBy = "title" } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where = {
      deleted_at: null,
      OR: search
        ? [
            { title: { contains: String(search), mode: "insensitive" } },
            { writer: { contains: String(search), mode: "insensitive" } },
          ]
        : undefined,
    };

    const [data, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [orderBy as string]: "asc" },
        include: { genre: { select: { id: true, name: true } } },
      }),
      prisma.book.count({ where }),
    ]);

    return res.status(200).json(
      response(true, "Books fetched successfully", {
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
 * @desc Get books by genre
 * @route GET /books/genre/:genre_id
 */
export const getBooksByGenre = async (req: Request, res: Response) => {
  try {
    const { genre_id } = req.params;

    const genre = await prisma.genre.findFirst({ where: { id: genre_id, deleted_at: null } });
    if (!genre) return res.status(404).json(response(false, "Genre not found"));

    const books = await prisma.book.findMany({
      where: { genre_id, deleted_at: null },
      include: { genre: true },
    });

    return res.status(200).json(response(true, "Books fetched successfully", books));
  } catch (error) {
    console.error(error);
    return res.status(500).json(response(false, "Internal server error"));
  }
};

/**
 * @desc Get book by ID
 * @route GET /books/:id
 */
export const getBookById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const book = await prisma.book.findFirst({
      where: { id, deleted_at: null },
      include: { genre: true },
    });

    if (!book) return res.status(404).json(response(false, "Book not found"));

    return res.status(200).json(response(true, "Book fetched successfully", book));
  } catch (error) {
    console.error(error);
    return res.status(500).json(response(false, "Internal server error"));
  }
};

/**
 * @desc Update book
 * @route PATCH /books/:id
 */
export const updateBook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = bookSchema.partial().safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json(response(false, "Validation error", parsed.error.flatten()));

    const existing = await prisma.book.findFirst({ where: { id, deleted_at: null } });
    if (!existing) return res.status(404).json(response(false, "Book not found"));

    const updated = await prisma.book.update({ where: { id }, data: parsed.data });

    return res.status(200).json(response(true, "Book updated successfully", updated));
  } catch (error) {
    console.error(error);
    return res.status(500).json(response(false, "Internal server error"));
  }
};

/**
 * @desc Soft delete book
 * @route DELETE /books/:id
 */
export const deleteBook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const book = await prisma.book.findFirst({ where: { id, deleted_at: null } });
    if (!book) return res.status(404).json(response(false, "Book not found"));

    await prisma.book.update({ where: { id }, data: { deleted_at: new Date() } });

    return res.status(200).json(response(true, "Book deleted successfully"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(response(false, "Internal server error"));
  }
};
