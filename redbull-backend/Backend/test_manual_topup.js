// import fetch from "node-fetch";
import mongoose from "mongoose";
import User from "./model/User.js";
import Payment from "./model/Payment.js";
import dotenv from "dotenv";

dotenv.config();

const API_BASE = "http://localhost:4000";

async function testManualTopUp() {
    await mongoose.connect(process.env.MONGO_URI);

    // 1. Create User
    const phone = "777" + Math.floor(Math.random() * 10000000);
    const user = await User.create({
        phone,
        password: "password",
        wallet: 0,
        referralCode: "REF" + Math.floor(Math.random() * 10000000)
    });
    console.log(`User created: ${user.phone}, Wallet: ${user.wallet}`);

    // 2. Login to get token (USER)
    const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: phone, password: "password" })
    });
    const loginData = await loginRes.json();
    const userToken = loginData.token;

    // 2.1 Create ADMIN
    const adminPhone = "999" + Math.floor(Math.random() * 10000000);
    await User.create({
        phone: adminPhone,
        password: "password",
        role: "admin",
        referralCode: "ADM" + Math.floor(Math.random() * 10000000)
    });
    const adminLoginRes = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: adminPhone, password: "password" })
    });
    const adminData = await adminLoginRes.json();
    const adminToken = adminData.token;

    // 3. Submit Manual Top-Up Request
    console.log("Submitting top-up request for ₹500...");
    const reqRes = await fetch(`${API_BASE}/api/payment/request`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${userToken}`
        },
        body: JSON.stringify({
            amount: 500,
            utr: "UTR" + Math.floor(Math.random() * 100000)
        })
    });
    const reqData = await reqRes.json();
    console.log("Request Response:", reqData);

    if (!reqData.success) {
        console.log("❌ Request Failed");
        process.exit(1);
    }

    const paymentId = reqData.payment._id;

    // 4. Admin Approve
    console.log(`Approving payment ${paymentId}...`);
    const approveRes = await fetch(`${API_BASE}/api/payment/approve`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({ paymentId })
    });
    const approveData = await approveRes.json();
    console.log("Approve Response:", approveData);

    // 5. Verify Wallet
    const updatedUser = await User.findById(user._id);
    console.log(`Updated Wallet: ${updatedUser.wallet}`);

    if (updatedUser.wallet === 500) {
        console.log("✅ SUCCESS: Wallet credited correctly.");
    } else {
        console.log("❌ FAILURE: Wallet balance incorrect.");
    }

    process.exit();
}

testManualTopUp();
