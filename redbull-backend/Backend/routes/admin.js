import express from "express";
import { authUser } from "../middleware/auth.js";
import {
  getAllUsers,
  getAllPayments,
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getAllPurchases
} from "../controller/adminController.js";

const router = express.Router();

// Admin routes
router.get("/users", authUser, getAllUsers);
router.get("/payments", authUser, getAllPayments);
router.get("/withdrawals", authUser, getAllWithdrawals);
router.get("/purchases", authUser, getAllPurchases);
router.post("/withdraw/approve", authUser, approveWithdrawal);
router.post("/withdraw/reject", authUser, rejectWithdrawal);

export default router;
