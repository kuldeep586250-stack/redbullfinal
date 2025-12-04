import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./model/User.js";

dotenv.config();

const connectDB = async () => {
    try {
        console.log("Attempting to connect to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected Successfully");

        // Create/Update admin user
        console.log("Creating/Updating admin user...");

        // Delete existing test user if exists to avoid duplicates
        await User.deleteOne({ email: "admin@test.com" });

        const adminUser = new User({
            name: "Super Admin",
            email: "admin@test.com",
            phone: "9999999999",
            password: "adminpassword", // Plain text, will work via fallback
            role: "admin",
            referralCode: "ADMIN1",
            wallet: 10000
        });

        await adminUser.save();
        console.log("✅ Admin user created successfully");

        // Check for users again
        const users = await User.find();
        console.log(`Found ${users.length} users in the database.`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Operation failed:", error.message);
        process.exit(1);
    }
};

connectDB();
