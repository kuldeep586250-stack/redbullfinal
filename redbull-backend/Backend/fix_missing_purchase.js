import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./model/User.js";
import Plan from "./model/Plan.js";
import Transaction from "./model/Transaction.js";

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

const fixPurchase = async () => {
    await connectDB();

    const phone = "6756453423";
    const user = await User.findOne({ phone });

    if (!user) {
        console.log("User not found");
        process.exit();
    }

    // 1. Find Plan
    const plan = await Plan.findOne({ price: 960 });
    if (!plan) {
        console.log("Plan 960 not found");
        process.exit();
    }

    console.log(`Fixing for user: ${user.phone}`);

    // 2. Deduct Wallet
    user.wallet -= 960;
    console.log(`Deducted 960. New Wallet: ${user.wallet}`);

    // 3. Add Plan
    user.plans.push({
        planId: plan._id,
        name: plan.name,
        price: plan.price,
        daily: plan.daily,
        days: plan.days,
        purchaseDate: new Date(),
        lastCredited: new Date()
    });
    user.hasPurchasedPlan = true;
    console.log(`Added plan: ${plan.name}`);

    // 4. Log Purchase Transaction
    await Transaction.create({
        userId: user._id,
        amount: 960,
        type: "plan_purchase",
        description: `Purchased ${plan.name}`
    });

    // 5. Signup Bonus (₹50)
    user.wallet += 50;
    console.log(`Added signup bonus 50. New Wallet: ${user.wallet}`);
    await Transaction.create({
        userId: user._id,
        amount: 50,
        type: "signup_bonus",
        description: "First plan purchase bonus"
    });

    // 6. Referral Bonus
    if (user.referredBy) {
        const referrer = await User.findOne({ referralCode: user.referredBy });
        if (referrer) {
            const bonus = 960 * 0.25; // 240
            referrer.wallet += bonus;
            await referrer.save();
            console.log(`Added referral bonus ${bonus} to ${referrer.phone}`);

            await Transaction.create({
                userId: referrer._id,
                amount: bonus,
                type: "referral_bonus",
                description: `Referral bonus from ${user.phone}`
            });
        } else {
            console.log("Referrer not found");
        }
    }

    await user.save();
    console.log("User saved. Fix complete.");

    process.exit();
};

fixPurchase();
