import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./model/User.js";
import { buyPlan } from "./controller/purchaseController.js";

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

const testPurchase = async () => {
    await connectDB();

    const phone = "6756453423";
    const user = await User.findOne({ phone });

    if (!user) {
        console.log("User not found");
        process.exit();
    }

    console.log(`Testing for user: ${user.phone}, Wallet: ${user.wallet}`);

    // Mock Request
    const req = {
        user: user,
        body: {
            planId: "test-plan-id",
            price: 100,
            name: "Test Plan",
            daily: 10,
            days: 30
        }
    };

    // Mock Response
    const res = {
        json: (data) => {
            console.log("Response:", JSON.stringify(data, null, 2));
        },
        status: (code) => {
            console.log("Status:", code);
            return { json: (data) => console.log("Response:", JSON.stringify(data, null, 2)) };
        }
    };

    // Ensure wallet has enough balance for test
    if (user.wallet < 100) {
        console.log("Adding temporary balance for test...");
        user.wallet += 100;
        await user.save();
    }

    try {
        await buyPlan(req, res);
    } catch (err) {
        console.error("Controller Error:", err);
    }

    process.exit();
};

testPurchase();
