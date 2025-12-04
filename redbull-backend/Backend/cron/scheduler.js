import cron from "node-cron";
import User from "../model/User.js";
import Transaction from "../model/Transaction.js";

export const processDailyIncomes = async () => {
    try {
        const now = new Date();

        // Find users with at least one active plan
        const users = await User.find({ "plans.status": "active" });

        for (const user of users) {
            let userUpdated = false;

            for (const plan of user.plans) {
                if (plan.status === "active" && new Date(plan.nextCredit) <= now) {

                    // Credit the daily amount
                    user.wallet += plan.daily;

                    // Update plan details
                    plan.remainingDays -= 1;
                    plan.lastCredited = now;

                    // Set next credit time (add 24 hours)
                    // Using timestamp to avoid drift, or just add 1 day to the previous nextCredit
                    // Ideally: new Date(plan.nextCredit).getTime() + 24*60*60*1000
                    // But if server was down for long, we might want to catch up or just set from now.
                    // Requirement: "every 24 hours".
                    // Let's strictly add 24h to the scheduled time to keep the cycle consistent.
                    const nextDate = new Date(plan.nextCredit);
                    nextDate.setDate(nextDate.getDate() + 1);
                    plan.nextCredit = nextDate;

                    // Check if plan is completed
                    if (plan.remainingDays <= 0) {
                        plan.status = "completed";
                    }

                    // Log Transaction
                    await Transaction.create({
                        userId: user._id,
                        amount: plan.daily,
                        type: "daily_income", // Ensure this type is allowed in Transaction model enum or add it
                        description: `Daily income from ${plan.name}`
                    });

                    userUpdated = true;
                    console.log(`[AUTO CREDIT] User: ${user.phone}, Plan: ${plan.name}, Amount: ${plan.daily}`);
                }
            }

            if (userUpdated) {
                // We need to mark 'plans' as modified because it's a mixed/array type in Mongoose often needs explicit mark
                user.markModified("plans");
                await user.save();
            }
        }

    } catch (err) {
        console.error("Scheduler Error:", err);
    }
};

export const startDailyIncomeScheduler = () => {
    console.log("--- Daily Income Scheduler Started ---");

    // Run every 60 seconds
    setInterval(processDailyIncomes, 60000); // 60 seconds
};
