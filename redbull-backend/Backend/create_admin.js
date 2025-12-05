import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./model/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to DB");

        const existingAdmin = await User.findOne({ role: "admin" });
        if (existingAdmin) {
            console.log("⚠️ Admin already exists:");
            console.log("Name:", existingAdmin.name);
            console.log("Phone:", existingAdmin.phone);
            console.log("Email:", existingAdmin.email);
            // We won't show the password hash, but we can tell the user it exists.
            // If they need a reset, we can do that.
            console.log("To reset password, run this script with --reset flag (not implemented yet, just ask me).");
        } else {
            console.log("Creating new admin...");
            const hashedPassword = await bcrypt.hash("admin123", 10);
            const admin = new User({
                name: "Super Admin",
                phone: "9999999999",
                email: "admin@redbull.com",
                password: hashedPassword,
                role: "admin",
                referralCode: "ADMIN1",
                wallet: 100000
            });
            await admin.save();
            console.log("✅ Admin created successfully!");
            console.log("Phone: 9999999999");
            console.log("Password: admin123");
        }

        await mongoose.disconnect();
        console.log("Disconnected");
    } catch (err) {
        console.error("❌ Admin creation failed:", err);
    }
};

createAdmin();
