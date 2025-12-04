import Payment from "../model/Payment.js";
import User from "../model/User.js";
import Plan from "../model/Plan.js";
import Transaction from "../model/Transaction.js";

export const createPaymentRequest = async (req, res) => {
  try {
    const { planId, utr, amount } = req.body;
    const userId = req.user.id;

    // 1. Wallet Top-Up (No Plan)
    if (!planId) {
      if (!amount || amount <= 0) {
        return res.json({ success: false, message: "Invalid amount" });
      }

      const payment = await Payment.create({
        userId,
        amount,
        utr,
        type: "wallet_topup"
      });

      return res.json({
        success: true,
        message: "Top-up request submitted",
        payment
      });
    }

    // 2. Plan Purchase
    const plan = await Plan.findById(planId);

    if (!plan)
      return res.json({ success: false, message: "Plan not found" });

    const payment = await Payment.create({
      userId,
      planId: plan._id,
      planName: plan.name,
      amount: plan.price,
      daily: plan.daily,
      days: plan.days,
      utr,
      type: "plan_purchase"
    });

    res.json({
      success: true,
      message: "Payment request submitted",
      payment
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const approvePayment = async (req, res) => {
  try {
    const { paymentId } = req.body;
    console.log(`[APPROVE] Request for paymentId: ${paymentId}`);

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      console.log("[APPROVE] Payment not found");
      return res.json({ success: false, message: "Payment not found" });
    }

    console.log(`[APPROVE] Found payment: ${payment.status}, Type: ${payment.type}, Amount: ${payment.amount}`);

    if (payment.status !== "pending") {
      console.log("[APPROVE] Payment already processed");
      return res.json({ success: false, message: "Already processed" });
    }

    const user = await User.findById(payment.userId);
    if (!user) {
      console.log("[APPROVE] User not found");
      return res.json({ success: false, message: "User not found" });
    }

    console.log(`[APPROVE] User before update: Wallet=${user.wallet}`);

    // 2️⃣ IF WALLET TOP-UP -> Credit Wallet
    if (payment.type === "wallet_topup") {
      console.log("[APPROVE] Processing as Wallet Top-Up");
      user.wallet += payment.amount; // Credit wallet only for top-up

      await Transaction.create({
        userId: user._id,
        amount: payment.amount,
        type: "wallet_topup",
        description: `Wallet top-up approved`
      });
    } else {
      console.log("[APPROVE] Processing as Plan Purchase");
      // 3️⃣ IF PLAN PURCHASE -> Activate plan (Do not credit wallet, as money is for plan)
      user.plans.push({
        planId: payment.planId,
        name: payment.planName, // Store as 'name' to match purchaseController
        amount: payment.amount,
        daily: payment.daily,
        days: payment.days,
        startDate: new Date(),
        active: true
      });

      // Referral & Signup Bonus (First Purchase Only)
      if (!user.hasPurchasedPlan) {
        // A) Signup Bonus (₹50)
        user.wallet += 50;
        await Transaction.create({
          userId: user._id,
          amount: 50,
          type: "signup_bonus",
          description: "Signup bonus for first plan purchase"
        });

        // B) Referral Commission (25%)
        if (user.referredBy) {
          const inviter = await User.findOne({ referralCode: user.referredBy });
          if (inviter) {
            const commission = payment.amount * 0.25;
            inviter.wallet += commission;
            await inviter.save();

            await Transaction.create({
              userId: inviter._id,
              amount: commission,
              type: "referral_bonus",
              description: `Referral commission from ${user.name}`,
              fromUser: user._id
            });
          }
        }

        user.hasPurchasedPlan = true;
      }

      // Log the Plan Purchase Transaction
      await Transaction.create({
        userId: user._id,
        amount: payment.amount,
        type: "plan_purchase",
        description: `Purchased plan: ${payment.planName}`
      });
    }

    await user.save();
    console.log(`[APPROVE] User saved. New Wallet=${user.wallet}`);

    // 4️⃣ Update payment status
    payment.status = "approved";
    payment.approvedAt = new Date();
    await payment.save();
    console.log("[APPROVE] Payment status updated to approved");

    res.json({ success: true, message: "Payment approved" });
  } catch (err) {
    console.error("[APPROVE] Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// ADMIN REJECT PAYMENT
export const rejectPayment = async (req, res) => {
  try {
    const { paymentId, reason } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.json({ success: false, message: "Not found" });

    payment.status = "rejected";
    payment.reason = reason;
    payment.rejectedAt = new Date();

    await payment.save();

    res.json({ success: true, message: "Payment rejected" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
