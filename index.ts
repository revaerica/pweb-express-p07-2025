import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

// Routes
import authRoute from "./routes/auth.route";
import genreRoute from "./routes/genre.route";
import booksRoute from "./routes/books.route";
import transactionsRoute from "./routes/transactions.route";

// Middlewares
import { errorMiddleware } from "./middlewares/error.middleware";
import { loggerMiddleware } from "./middlewares/logger.middleware";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// 🔧 Global middlewares
app.use(cors());
app.use(express.json());
app.use(loggerMiddleware);

// 🩺 Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    data: { date: new Date().toISOString() },
  });
});

// 📦 Route registrations
app.use("/auth", authRoute);
app.use("/genres", genreRoute); // ✅ plural (lebih natural & sesuai dokumen)
app.use("/books", booksRoute);
app.use("/transactions", transactionsRoute);

// 🛠️ Global error handler
app.use(errorMiddleware);

// 🚀 Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
