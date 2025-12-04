import User from "../model/User.js";
import Payment from "../model/Payment.js";
import Withdraw from "../model/Withdraw.js";
import Transaction from "../model/Transaction.js";

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password -otp -otpExpiry");
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all payments
export const getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate("userId", "name email phone")
            .sort({ createdAt: -1 });
        res.json({ success: true, payments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all withdrawals
export const getAllWithdrawals = async (req, res) => {
    try {
        const withdrawals = await Withdraw.find()
            .populate("userId", "name email phone")
            .sort({ createdAt: -1 });
        res.json({ success: true, withdrawals });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all purchased plans
export const getAllPurchases = async (req, res) => {
    try {
        const purchases = await Transaction.find({ type: "plan_purchase" })
            .populate("userId", "name phone")
            .sort({ date: -1 });
        res.json({ success: true, purchases });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Approve withdrawal
export const approveWithdrawal = async (req, res) => {
    try {
        const { withdrawId } = req.body;

        const withdrawal = await Withdraw.findById(withdrawId);
        if (!withdrawal) {
            return res.json({ success: false, message: "Withdrawal not found" });
        }

        if (withdrawal.status !== "pending") {
            return res.json({ success: false, message: "Withdrawal already processed" });
        }

        const user = await User.findById(withdrawal.userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Check balance again before approving
        if (user.wallet < withdrawal.amount) {
            return res.json({ success: false, message: "User has insufficient wallet balance now" });
        }

        // --- FEE LOGIC ---
        // 10% Service Fee
        const fee = withdrawal.amount * 0.10;
        const payable = withdrawal.amount - fee;

        // Deduct FULL amount from wallet
        user.wallet -= withdrawal.amount;
        await user.save();

        // Update withdrawal status & details
        withdrawal.status = "approved";
        withdrawal.fee = fee;
        withdrawal.payable = payable;
        withdrawal.approvedAt = new Date();
        await withdrawal.save();

        // Create Transaction Record
        // We log the full deduction, but maybe mention the fee in description
        await Transaction.create({
            userId: user._id,
            amount: withdrawal.amount,
            type: "withdrawal",
            description: `Withdrawal Approved (Amount: ${withdrawal.amount}, Fee: ${fee}, Payable: ${payable})`
        });

        res.json({ success: true, message: `Approved. Fee: ${fee}, Payable: ${payable}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Reject withdrawal
export const rejectWithdrawal = async (req, res) => {
    try {
        const { withdrawId, reason } = req.body;

        const withdrawal = await Withdraw.findById(withdrawId);
        if (!withdrawal) {
            return res.json({ success: false, message: "Withdrawal not found" });
        }

        if (withdrawal.status !== "pending") {
            return res.json({ success: false, message: "Withdrawal already processed" });
        }

        withdrawal.status = "rejected";
        withdrawal.rejectedAt = new Date();
        withdrawal.reason = reason || "Rejected by admin";
        await withdrawal.save();

        res.json({ success: true, message: "Withdrawal rejected" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
