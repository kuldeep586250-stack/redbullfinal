import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const testDB = async () => {
    try {
        console.log("Testing connection to:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log("✅ Connected successfully");

        const user = await mongoose.connection.db.collection("users").findOne({ phone: "9876543212" });
        console.log("User found:", user);

        await mongoose.disconnect();
        console.log("Disconnected");
    } catch (error) {
        console.error("❌ Connection failed:", error.message);
    }
};

testDB();
