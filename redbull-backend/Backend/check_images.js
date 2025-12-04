import mongoose from "mongoose";
import dotenv from "dotenv";
import Plan from "./model/Plan.js";

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

const checkImages = async () => {
    await connectDB();

    const plans = await Plan.find();
    plans.forEach(p => {
        console.log(`Plan: ${p.name}, Image: ${p.image}`);
    });

    process.exit();
};

checkImages();
