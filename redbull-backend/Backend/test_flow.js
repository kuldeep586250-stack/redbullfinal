// import fetch from "node-fetch"; // Native fetch

const API_URL = "http://localhost:4000/api";
const PHONE = "9876543212";
const PASS = "password123";

const runFlow = async () => {
    try {
        console.log("--- 1. LOGIN ---");
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: PHONE, password: PASS })
        });
        const loginData = await loginRes.json();
        if (!loginData.success) throw new Error("Login failed: " + loginData.message);
        console.log("Login Success. Token:", loginData.token.substring(0, 20) + "...");
        const token = loginData.token;

        console.log("\n--- 2. GET PLANS ---");
        const plansRes = await fetch(`${API_URL}/plans`);
        const plansText = await plansRes.text();

        let plansData;
        try {
            plansData = JSON.parse(plansText);
        } catch (e) {
            console.error("Failed to parse Plans JSON. Raw:", plansText.substring(0, 100));
            return;
        }

        // Check if plansData is the array or if it's inside an object
        let plans = [];
        if (Array.isArray(plansData)) {
            plans = plansData;
        } else if (plansData.success && Array.isArray(plansData.plans)) {
            plans = plansData.plans;
        } else {
            console.log("Plans Data format incorrect:", plansData);
        }

        if (plans.length > 0) {
            console.log(`Found ${plans.length} plans.`);
            console.log("First Plan:", plans[0].name, "Price:", plans[0].price);
        } else {
            console.log("No plans found.");
        }

        console.log("\n--- 3. GET PROFILE (WALLET) ---");
        // Correct endpoint: /api/user/profile
        const userRes = await fetch(`${API_URL}/user/profile`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const userText = await userRes.text();
        let userData;
        try {
            userData = JSON.parse(userText);
        } catch (e) {
            console.error("Failed to parse User JSON. Raw:", userText.substring(0, 100));
            return;
        }
        console.log("Wallet Balance:", userData.user ? userData.user.wallet : "N/A");

        console.log("\n--- 4. BUY PLAN (Simulate) ---");
        if (plans.length > 0) {
            const plan = plans[0];
            // Note: Buying requires wallet balance. We have 0.
            // This should fail with "Insufficient balance".
            // Correct endpoint: /api/purchases/buy
            const buyRes = await fetch(`${API_URL}/purchases/buy`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    planId: plan._id || plan.id,
                    amount: plan.price
                })
            });
            const buyData = await buyRes.json();
            console.log("Buy Plan Result:", buyData);
        }

        console.log("\n--- 5. RECHARGE REQUEST (Simulate) ---");
        const rechargeRes = await fetch(`${API_URL}/payment/request`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                amount: 500,
                utr: "TEST_UTR_123456"
            })
        });
        const rechargeData = await rechargeRes.json();
        console.log("Recharge Request Result:", rechargeData);

    } catch (err) {
        console.error("❌ Flow Failed:", err.message);
    }
};

runFlow();
