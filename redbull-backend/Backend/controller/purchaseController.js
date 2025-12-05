import User from "../model/User.js";
import Plan from "../model/Plan.js";
import Transaction from "../model/Transaction.js";

export const buyPlan = async (req, res) => {
    try {
        const { planId } = req.body; // Only need planId from body
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) return res.json({ success: false, message: "User not found" });

        // Fetch Plan from DB
        const plan = await Plan.findById(planId);
        if (!plan) return res.json({ success: false, message: "Plan not found" });

        const { price, name, daily, days } = plan;

        if (user.wallet < price) {
            return res.json({ success: false, message: "Insufficient balance" });
        }

        // --- BONUS LOGIC (First Purchase) ---
        if (!user.hasPurchasedPlan) {
            // 1. Referral Bonus (25%)
            if (user.referredBy) {
                const referrer = await User.findOne({ referralCode: user.referredBy });
                if (referrer) {
                    const bonus = price * 0.25;
                    referrer.wallet += bonus;
                    await referrer.save();

                    // Log transaction for referrer
                    await Transaction.create({
                        userId: referrer._id,
                        amount: bonus,
                        type: "referral_bonus",
                        description: `Referral bonus from ${user.phone}`
                    });
                }
            }

            // 2. Self Bonus (₹50)
            user.wallet += 50;
            // Log transaction for user
            await Transaction.create({
                userId: user._id,
                amount: 50,
                type: "signup_bonus",
                description: "First plan purchase bonus"
            });

            user.hasPurchasedPlan = true;
        }

        // --- DEDUCT BALANCE ---
        user.wallet -= price;

        // --- ADD PLAN ---
        const newPlan = {
            planId: plan._id,
            name,
            price,
            daily,
            days,
            purchaseDate: new Date(),
            lastCredited: new Date(),
            // --- NEW FIELDS FOR AUTO CREDIT ---
            totalDays: days,
            remainingDays: days,
            nextCredit: new Date(Date.now() + 24 * 60 * 60 * 1000), // First credit after 24 hours
            status: 'active'
        };
        user.plans.push(newPlan);

        await user.save();

        // Log purchase transaction
        await Transaction.create({
            userId: user._id,
            amount: price,
            type: "plan_purchase",
            description: `Purchased ${name}`
        });

        res.json({
            success: true,
            message: "Plan purchased successfully",
            wallet: user.wallet,
            plans: user.plans,
            user // return full user to sync frontend
        });

    } catch (err) {
        console.error("Buy Plan Error:", err);
        res.json({ success: false, message: err.message });
    }
};
