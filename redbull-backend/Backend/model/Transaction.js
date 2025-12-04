import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    type: {
        type: String,
        enum: ["deposit", "withdrawal", "referral_bonus", "signup_bonus", "plan_purchase", "wallet_topup", "daily_income"],
        required: true
    },
    description: { type: String, default: "" },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // For referral bonus tracking
    date: { type: Date, default: Date.now }
});

export default mongoose.model("Transaction", transactionSchema);
