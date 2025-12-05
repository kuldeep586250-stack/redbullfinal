import mongoose from "mongoose";
import User from "./model/User.js";
import Plan from "./model/Plan.js";
import Payment from "./model/Payment.js";
import { approvePayment } from "./controller/paymentController.js";

// Mock Express Request/Response
const mockRes = {
    json: (data) => console.log("Response:", JSON.stringify(data, null, 2)),
    status: (code) => ({ json: (data) => console.log(`Status ${code}:`, data) })
};

async function runTest() {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/Redbull");
        console.log("Connected to DB");

        // Cleanup previous test data
        await User.deleteMany({ phone: { $in: ["9999999999", "8888888888"] } });
        await Plan.deleteOne({ name: "Test Bonus Plan" });

        // 1. Create Referrer (User A)
        const referrerCode = "REF" + Math.floor(Math.random() * 10000);
        const userA = await User.create({
            phone: "9999999999",
            password: "password",
            role: "user",
            referralCode: referrerCode,
            wallet: 0
        });
        console.log(`User A created. Wallet: ${userA.wallet}`);

        // 2. Create Referee (User B)
        const userB = await User.create({
            phone: "8888888888",
            password: "password",
            role: "user",
            referralCode: "REF" + Math.floor(Math.random() * 10000),
            referredBy: referrerCode,
            wallet: 0
        });
        console.log(`User B created. Referred By: ${userB.referredBy}`);

        // 3. Create Plan
        const plan = await Plan.create({
            name: "Test Bonus Plan",
            price: 1000,
            daily: 100,
            days: 30,
            type: "buy"
        });
        console.log(`Plan created. Price: ${plan.price}`);

        // 4. Create Payment Request for User B
        const payment = await Payment.create({
            userId: userB._id,
            planId: plan._id,
            planName: plan.name,
            amount: plan.price,
            daily: plan.daily,
            days: plan.days,
            utr: "TEST_UTR_BONUS",
            type: "plan_purchase",
            status: "pending"
        });

        // 5. Approve Payment
        console.log("Approving payment...");
        const req = { body: { paymentId: payment._id } };
        await approvePayment(req, mockRes);

        // 6. Verify User A Wallet
        const updatedUserA = await User.findById(userA._id);
        console.log(`User A Wallet after approval: ${updatedUserA.wallet}`);

        const expectedBonus = plan.price * 0.25; // 250

        if (updatedUserA.wallet === expectedBonus) {
            console.log(`✅ SUCCESS: Wallet matches 25% (${expectedBonus})`);
        } else {
            const percentage = (updatedUserA.wallet / plan.price) * 100;
            console.log(`❌ FAIL: Wallet is ${updatedUserA.wallet}. That is ${percentage}%`);
        }

        // Cleanup
        await User.deleteMany({ phone: { $in: ["9999999999", "8888888888"] } });
        await Plan.deleteOne({ _id: plan._id });
        await Payment.deleteOne({ _id: payment._id });
        console.log("Cleanup done.");

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

runTest();
