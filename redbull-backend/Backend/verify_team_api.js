import mongoose from "mongoose";
import User from "./model/User.js";
import Payment from "./model/Payment.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

async function verifyTeam() {
    await mongoose.connect(process.env.MONGO_URI);

    // 1. Create Referrer
    const referrerCode = "TEAMREF" + Math.random().toString(36).substring(7);
    const referrerPhone = Math.floor(Math.random() * 10000000000).toString();
    const referrer = await User.create({
        phone: referrerPhone,
        password: "password",
        referralCode: referrerCode,
        wallet: 0
    });
    console.log("Referrer:", referrer.phone, referrerCode);

    // 2. Create Referee 1 (With Plan)
    const referee1 = await User.create({
        phone: Math.floor(Math.random() * 10000000000).toString(),
        password: "password",
        referralCode: "REF1" + Math.random().toString(36).substring(7),
        referredBy: referrerCode,
        wallet: 0,
        plans: [{ name: "Plan A", amount: 1000 }]
    });

    // 3. Create Referee 2 (No Plan)
    const referee2 = await User.create({
        phone: Math.floor(Math.random() * 10000000000).toString(),
        password: "password",
        referralCode: "REF2" + Math.random().toString(36).substring(7),
        referredBy: referrerCode,
        wallet: 0,
        plans: []
    });

    // 4. Generate Token for Referrer
    const token = jwt.sign({ id: referrer._id }, process.env.JWT_SECRET);

    // 5. Call API (Simulate)
    console.log("Fetching Team Data...");
    const res = await fetch("http://localhost:4000/api/user/team", {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();

    console.log("API Response:", JSON.stringify(data, null, 2));

    if (data.success && data.teamSize === 2 && data.teamRecharge === 1000) {
        console.log("✅ Verification Successful");
    } else {
        console.log("❌ Verification Failed");
    }

    process.exit();
}

verifyTeam();
