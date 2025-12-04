import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  planId: { type: String, default: null },
  planName: { type: String, default: null },
  amount: { type: Number, required: true },
  daily: { type: Number, default: 0 },
  days: { type: Number, default: 0 },

  type: {
    type: String,
    enum: ["plan_purchase", "wallet_topup"],
    default: "plan_purchase"
  },

  utr: { type: String, required: true },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  createdAt: { type: Date, default: Date.now },
  approvedAt: Date,
  rejectedAt: Date,
  reason: String
});

export default mongoose.model("Payment", paymentSchema);
