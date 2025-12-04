import mongoose from "mongoose";
import User from "./model/User.js";
import Payment from "./model/Payment.js";
import Transaction from "./model/Transaction.js";
import dotenv from "dotenv";
// import fetch from "node-fetch";

dotenv.config();

async function verify() {
    await mongoose.connect(process.env.MONGO_URI);

    // 1. Find the test data we created (Latest one)
    const referee = await User.findOne({ referredBy: { $ne: null } }).sort({ createdAt: -1 });
    if (!referee) {
        console.log("Referee not found. Run setup first.");
        process.exit();
    }

    const payment = await Payment.findOne({ userId: referee._id, status: "pending" });
    if (!payment) {
        console.log("Pending payment not found.");
        process.exit();
    }

    console.log("Found Payment:", payment._id);

    // 2. Promote user to admin to allow approval
    // Using the token's user ID: 69309bb61d6575a2901f20ca
    await User.findByIdAndUpdate("69309bb61d6575a2901f20ca", { role: "admin" });
    console.log("Promoted test user to admin.");

    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MzA5YmI2MWQ2NTc1YTI5MDFmMjBjYSIsImlhdCI6MTc2NDc5MzMyMSwiZXhwIjoxNzY1Mzk4MTIxfQ.5345N9hovFAZFx3N4t8mT9CpZAVW8FK1v_dNmp99irQ";

    console.log("Approving payment via API...");
    const res = await fetch("http://localhost:4000/api/payment/approve", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ paymentId: payment._id })
    });

    const data = await res.json();
    console.log("API Response:", data);

    if (data.success) {
        // 3. Verify Bonuses
        const updatedReferee = await User.findById(referee._id);
        console.log("Referee Wallet (Expected 50):", updatedReferee.wallet);

        const referrer = await User.findOne({ referralCode: referee.referredBy });
        console.log("Referrer Wallet (Expected 250):", referrer.wallet); // 25% of 1000 = 250

        const transactions = await Transaction.find({ $or: [{ userId: referee._id }, { userId: referrer._id }] });
        console.log("Transactions:", transactions.length);
        transactions.forEach(t => console.log(`- ${t.type}: ${t.amount} (${t.description})`));
    }

    process.exit();
}

verify();
