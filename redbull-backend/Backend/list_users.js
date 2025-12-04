import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./model/User.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const listUsers = async () => {
    try {
        await connectDB();
        const users = await User.find({}, "name phone role");
        console.log("--- USERS ---");
        users.forEach(u => {
            console.log(`${u.name} (${u.phone}) - Role: ${u.role}`);
        });
        console.log("-------------");
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

listUsers();
