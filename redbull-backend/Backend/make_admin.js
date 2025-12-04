import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./model/User.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const makeAdmin = async () => {
    try {
        await connectDB();

        const phone = "9999999999";
        const user = await User.findOne({ phone });

        if (!user) {
            console.log("User not found!");
            process.exit(1);
        }

        user.role = "admin";
        await user.save();

        console.log(`User ${user.name} (${user.phone}) is now an Admin.`);
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

makeAdmin();
