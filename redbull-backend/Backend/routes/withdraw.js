import express from "express";
import Withdraw from "../model/Withdraw.js";
import User from "../model/User.js";
import { authUser } from "../middleware/auth.js";

const router = express.Router();

// USER SEND WITHDRAW REQUEST
router.post("/request", authUser, async (req, res) => {
    try {
        const { amount, bankName, ifsc, account, mobile } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) return res.json({ success: false, message: "User not found" });

        if (user.wallet < amount)
            return res.json({ success: false, message: "Insufficient balance" });

        const withdraw = new Withdraw({
            userId: user._id,
            amount,
            bankName,
            ifsc,
            account,
            mobile
        });

        await withdraw.save();

        res.json({ success: true, message: "Withdraw request sent" });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// GET USER WITHDRAWAL HISTORY
router.get("/history", authUser, async (req, res) => {
    try {
        const withdrawals = await Withdraw.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, withdrawals });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

export default router;
