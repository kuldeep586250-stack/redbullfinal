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

const updatePlan = async () => {
    await connectDB();

    const plan = await Plan.findOne({ name: "Silver Gain" });
    if (plan) {
        plan.image = "Frontend/assets/images/ga.jpg";
        await plan.save();
        console.log("Updated Silver Gain image to ga.jpg");
    } else {
        console.log("Silver Gain plan not found");
    }

    process.exit();
};

updatePlan();
