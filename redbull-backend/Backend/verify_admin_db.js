import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./model/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

const verifyAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to DB:", process.env.MONGO_URI);

        const admin = await User.findOne({ role: "admin" });
        if (admin) {
            console.log("Found admin:");
            console.log("ID:", admin._id);
            console.log("Name:", admin.name);
            console.log("Phone:", admin.phone);
            console.log("Email:", admin.email);
            console.log("Role:", admin.role);

            // Reset password to be sure
            const hashedPassword = await bcrypt.hash("admin123", 10);
            admin.password = hashedPassword;
            await admin.save();
            console.log("✅ Password reset to: admin123");
        } else {
            console.log("❌ Admin NOT found in DB!");
        }

        await mongoose.disconnect();
        console.log("Disconnected");
    } catch (err) {
        console.error("❌ Verification failed:", err);
    }
};

verifyAdmin();
