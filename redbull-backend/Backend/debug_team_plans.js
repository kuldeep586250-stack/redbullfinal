import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./model/User.js";

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

const debugPlans = async () => {
    await connectDB();

    // Phones from screenshot
    const phones = ["6756453423", "9765434567", "9876543234", "3245676549"];

    const users = await User.find({ phone: { $in: phones } });

    console.log("\n--- DEBUG USER PLANS ---");
    users.forEach(u => {
        console.log(`User: ${u.phone}`);
        console.log(`Plans Count: ${u.plans.length}`);
        console.log("Plans Data:", JSON.stringify(u.plans, null, 2));
        console.log("-----------------------");
    });

    process.exit();
};

debugPlans();
