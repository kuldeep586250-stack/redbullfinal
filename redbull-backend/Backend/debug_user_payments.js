import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./model/User.js";
import Payment from "./model/Payment.js";
import Transaction from "./model/Transaction.js";

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("DB Error:", error);
        process.exit(1);
    }
};

const debugPayments = async () => {
    await connectDB();

    const phone = "9765434567";
    const user = await User.findOne({ phone });

    if (!user) {
        console.log("User not found");
        process.exit();
    }

    console.log(`\n--- USER: ${user.phone} (${user._id}) ---`);
    console.log(`Wallet: ${user.wallet}`);
    console.log(`Plans: ${user.plans.length}`);

    console.log("\n--- PAYMENTS ---");
    const payments = await Payment.find({ userId: user._id });
    payments.forEach(p => {
        console.log(`- Amount: ${p.amount}, Type: ${p.type}, Status: ${p.status}, Plan: ${p.planName}`);
    });

    console.log("\n--- TRANSACTIONS ---");
    const transactions = await Transaction.find({ userId: user._id });
    transactions.forEach(t => {
        console.log(`- Amount: ${t.amount}, Type: ${t.type}, Desc: ${t.description}`);
    });

    process.exit();
};

debugPayments();
