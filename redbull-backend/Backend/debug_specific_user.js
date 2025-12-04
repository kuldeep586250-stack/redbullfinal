import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./model/User.js";
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

const debugSpecificUser = async () => {
    await connectDB();

    const phone = "6756453423";
    const user = await User.findOne({ phone });

    if (!user) {
        console.log("User not found");
        process.exit();
    }

    console.log(`\n--- USER: ${user.phone} ---`);
    console.log(`Referred By: ${user.referredBy}`);
    console.log(`Wallet: ${user.wallet}`);
    console.log(`Plans Count: ${user.plans.length}`);
    console.log("Plans Data:", JSON.stringify(user.plans, null, 2));

    console.log("\n--- RECENT TRANSACTIONS ---");
    const transactions = await Transaction.find({ userId: user._id }).sort({ createdAt: -1 }).limit(5);
    transactions.forEach(t => {
        console.log(`- ${t.type}: ${t.amount} (${t.description})`);
    });

    process.exit();
};

debugSpecificUser();
