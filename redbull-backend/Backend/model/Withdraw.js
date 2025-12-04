import mongoose from "mongoose";

const withdrawSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    fee: { type: Number, default: 0 },
    payable: { type: Number, default: 0 },

    // Bank Details
    bankName: String,
    ifsc: String,
    account: String,
    mobile: String,

    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },

    reason: { type: String, default: "" },

    createdAt: { type: Date, default: Date.now },
    approvedAt: Date,
    rejectedAt: Date
});

export default mongoose.model("Withdraw", withdrawSchema);
