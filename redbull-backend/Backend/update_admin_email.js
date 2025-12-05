import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./model/User.js";

dotenv.config();

const updateAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to DB");

        const admin = await User.findOne({ role: "admin" });
        if (admin) {
            console.log("Found admin:", admin.email);
            admin.email = "admin@test.com";
            await admin.save();
            console.log("✅ Admin email updated to: admin@test.com");
        } else {
            console.log("❌ Admin not found!");
        }

        await mongoose.disconnect();
        console.log("Disconnected");
    } catch (err) {
        console.error("❌ Update failed:", err);
    }
};

updateAdmin();
