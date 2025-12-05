import mongoose from "mongoose";
import User from "./model/User.js";
import dotenv from "dotenv";
dotenv.config();

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/Redbull");
        const admin = await User.findOne({ role: "admin" });
        if (admin) {
            console.log("Admin Found:");
            console.log("Phone:", admin.phone);
            console.log("Email:", admin.email);
        } else {
            console.log("No Admin Found");
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkAdmin();
