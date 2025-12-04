import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/admin.js";
import passwordRoutes from "./routes/forgotPasswordRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import withdrawRoutes from "./routes/withdraw.js";

dotenv.config();

// Connect to Database
connectDB();

// Start Scheduler
import { startDailyIncomeScheduler } from "./cron/scheduler.js";
startDailyIncomeScheduler();

const app = express();

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

app.get("/", (req, res) => res.send("API Running"));

// Routes
import transactionRoutes from "./routes/transactionRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/user", userRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/purchases", purchaseRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("--- SERVER RESTARTED ---");
});
