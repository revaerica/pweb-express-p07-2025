import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { response } from "../utils/response";
import { z } from "zod";

/**
 * @desc Create transaction
 * @route POST /transactions
 */
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const schema = z.object({
      items: z
        .array(
          z.object({
            book_id: z.string().uuid(),
            quantity: z.number().int().positive(),
          })
        )
        .min(1, "Items cannot be empty"),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(response(false, "Validation error", parsed.error.flatten()));
    }

    const { items } = parsed.data;

    // Cek apakah semua buku valid dan stok cukup
    for (const item of items) {
      const book = await prisma.book.findFirst({
        where: { id: item.book_id, deleted_at: null },
      });
      if (!book) return res.status(404).json(response(false, `Book ${item.book_id} not found`));
      if (book.stock_quantity < item.quantity) {
        return res.status(400).json(response(false, `Insufficient stock for ${book.title}`));
      }
    }

    // Buat transaksi
    const order = await prisma.order.create({
      data: {
        user_id: userId,
        items: {
          create: items.map((item) => ({
            book_id: item.book_id,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    // Kurangi stok buku
    for (const item of items) {
      await prisma.book.update({
        where: { id: item.book_id },
        data: {
          stock_quantity: { decrement: item.quantity },
        },
      });
    }

    return res.status(201).json(response(true, "Transaction created successfully", order));
  } catch (error) {
    console.error(error);
    return res.status(500).json(response(false, "Internal server error"));
  }
};

/**
 * @desc Get all transactions
 * @route GET /transactions
 */
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.order.findMany({
      include: {
        user: { select: { id: true, email: true } },
        items: {
          include: {
            book: { select: { id: true, title: true, price: true } },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return res.status(200).json(response(true, "Transactions fetched successfully", transactions));
  } catch (error) {
    console.error(error);
    return res.status(500).json(response(false, "Internal server error"));
  }
};

/**
 * @desc Get transaction by ID
 * @route GET /transactions/:id
 */
export const getTransactionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true } },
        items: {
          include: { book: { select: { id: true, title: true, price: true } } },
        },
      },
    });

    if (!order) return res.status(404).json(response(false, "Transaction not found"));

    return res.status(200).json(response(true, "Transaction fetched successfully", order));
  } catch (error) {
    console.error(error);
    return res.status(500).json(response(false, "Internal server error"));
  }
};

/**
 * @desc Get transaction statistics
 * @route GET /transactions/statistics
 */
export const getStatistics = async (req: Request, res: Response) => {
  try {
    // Jumlah transaksi total
    const totalTransactions = await prisma.order.count();

    // Total item terjual & total nilai penjualan
    const orderItems = await prisma.orderItem.findMany({
      include: { book: true },
    });

    let totalBooksSold = 0;
    let totalRevenue = 0;

    orderItems.forEach((item) => {
      totalBooksSold += item.quantity;
      totalRevenue += item.book.price * item.quantity;
    });

    // Genre terlaris
    const genreStats = await prisma.book.groupBy({
      by: ["genre_id"],
      _sum: { stock_quantity: true },
    });

    const mostPopularGenre = genreStats.sort((a, b) => a._sum.stock_quantity - b._sum.stock_quantity)[0];

    return res.status(200).json(
      response(true, "Statistics fetched successfully", {
        totalTransactions,
        totalBooksSold,
        totalRevenue,
        mostPopularGenre,
      })
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json(response(false, "Internal server error"));
  }
};
