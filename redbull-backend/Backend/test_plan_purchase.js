// import fetch from "node-fetch";
import mongoose from "mongoose";
import User from "./model/User.js";
import Plan from "./model/Plan.js";
import Payment from "./model/Payment.js";
import dotenv from "dotenv";

dotenv.config();

const API_BASE = "http://localhost:4000";

async function testPlanPurchase() {
    await mongoose.connect(process.env.MONGO_URI);

    // 1. Create User
    const phone = "888" + Math.floor(Math.random() * 10000000);
    const user = await User.create({
        phone,
        password: "password",
        wallet: 0,
        referralCode: "USR" + Math.floor(Math.random() * 10000000)
    });
    console.log(`User created: ${user.phone}`);

    // 2. Login
    const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: phone, password: "password" })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    // 3. Create a Plan (if not exists, but for test we create one)
    const plan = await Plan.create({
        name: "Test Plan",
        price: 960,
        daily: 100,
        days: 30,
        type: "buy",
        isVip: false
    });
    console.log(`Plan created: ${plan.name} (${plan._id})`);

    // 4. Submit Payment Request with Plan ID
    console.log("Submitting plan purchase request...");
    const reqRes = await fetch(`${API_BASE}/api/payment/request`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            amount: 960,
            utr: "UTR_PLAN_" + Math.floor(Math.random() * 100000),
            planId: plan._id
        })
    });

    // Check status before parsing JSON
    if (!reqRes.ok) {
        console.log(`❌ Request Failed with status: ${reqRes.status}`);
        const text = await reqRes.text();
        console.log("Response body:", text);
        process.exit(1);
    }

    const reqData = await reqRes.json();
    console.log("Request Response:", reqData);

    if (reqData.success) {
        console.log("✅ SUCCESS: Plan purchase request submitted.");
    } else {
        console.log("❌ FAILURE: " + reqData.message);
    }

    process.exit();
}

testPlanPurchase();
