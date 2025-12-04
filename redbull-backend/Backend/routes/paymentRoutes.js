import express from "express";
import { createPaymentRequest, approvePayment, rejectPayment } from "../controller/paymentController.js";
import { authUser, authAdmin } from "../middleware/auth.js";
import Payment from "../model/Payment.js";

const router = express.Router();

// USER
router.post("/request", authUser, createPaymentRequest);

// ADMIN
router.post("/approve", authAdmin, approvePayment);
router.post("/reject", authAdmin, rejectPayment);

router.get("/user", authUser, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ success: true, payments });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});


export default router;
