import mongoose from "mongoose";
import dotenv from "dotenv";
import Plan from "./model/Plan.js"; // Assuming Plan model exists

dotenv.config();

const plans = [
    {
        name: "Red Bull Starter",
        price: 500,
        daily: 20,
        days: 30,
        isVip: false,
        type: "basic",
        image: "assets/images/plan1.jpg"
    },
    {
        name: "Red Bull Pro",
        price: 2000,
        daily: 100,
        days: 45,
        isVip: false,
        type: "basic",
        image: "assets/images/plan2.jpg"
    },
    {
        name: "Red Bull VIP 1",
        price: 5000,
        daily: 300,
        days: 15,
        isVip: true,
        type: "basic",
        image: "assets/images/plan3.jpg"
    },
    {
        name: "Flash Sale Plan",
        price: 1000,
        daily: 50,
        days: 10,
        isVip: false,
        type: "timer",
        timerHours: 24,
        image: "assets/images/plan4.jpg"
    }
];

const seedPlans = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to DB");

        await Plan.deleteMany({});
        console.log("Cleared existing plans");

        await Plan.insertMany(plans);
        console.log(`✅ Seeded ${plans.length} plans`);

        await mongoose.disconnect();
        console.log("Disconnected");
    } catch (err) {
        console.error("❌ Seeding failed:", err);
    }
};

seedPlans();
