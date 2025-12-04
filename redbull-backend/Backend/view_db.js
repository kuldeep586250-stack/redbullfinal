import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./model/User.js";
import Payment from "./model/Payment.js";
import Plan from "./model/Plan.js";

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

const viewData = async () => {
    await connectDB();

    console.log("\n--- USERS (Last 5) ---");
    const users = await User.find().sort({ createdAt: -1 }).limit(5);
    users.forEach(u => {
        console.log(`- Phone: ${u.phone}, Wallet: ${u.wallet}, Code: ${u.referralCode}, ReferredBy: ${u.referredBy}`);
    });

    console.log("\n--- PAYMENTS (Last 5) ---");
    const payments = await Payment.find().sort({ createdAt: -1 }).limit(5);
    payments.forEach(p => {
        console.log(`- Amount: ${p.amount}, Type: ${p.type}, Status: ${p.status}, UTR: ${p.utr}`);
    });

    console.log("\n--- PLANS ---");
    const plans = await Plan.find();
    plans.forEach(p => {
        console.log(`- ${p.name}: ₹${p.price} (Daily: ₹${p.daily})`);
    });

    console.log("\nDone.");
    process.exit();
};

viewData();
