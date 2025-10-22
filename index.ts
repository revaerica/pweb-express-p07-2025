import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import authRoute from "./routes/auth.route";
import genreRoute from "./routes/genre.route";
import booksRoute from "./routes/books.route";
import transactionsRoute from "./routes/transactions.route";
import { errorMiddleware } from "./middlewares/error.middleware";
import { loggerMiddleware } from "./middlewares/logger.middleware";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.use(loggerMiddleware); 

app.get("/health", (req, res) => {
  res.json({ success: true, message: "Server is running", data: { date: new Date() } });
});

app.use("/auth", authRoute);
app.use("/genre", genreRoute);
app.use("/books", booksRoute);
app.use("/transactions", transactionsRoute);
app.use(errorMiddleware);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
