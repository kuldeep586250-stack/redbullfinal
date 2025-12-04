import mongoose from "mongoose";
import User from "./model/User.js";
import dotenv from "dotenv";

dotenv.config();

async function addFunds() {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findById("69309bb61d6575a2901f20ca");
    if (user) {
        user.wallet += 1000;
        await user.save();
        console.log("Added 1000 to wallet. New balance:", user.wallet);
    } else {
        console.log("User not found");
    }
    process.exit();
}

addFunds();
