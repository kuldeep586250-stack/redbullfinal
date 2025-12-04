import mongoose from "mongoose";
import Withdraw from "./model/Withdraw.js";
import dotenv from "dotenv";

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const w = await Withdraw.findOne().sort({ createdAt: -1 });
    console.log("Latest Withdrawal:", w);
    process.exit();
}

check();
