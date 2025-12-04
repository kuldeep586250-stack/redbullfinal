// import fetch from "node-fetch"; // Use built-in fetch
import mongoose from "mongoose";
import User from "./model/User.js";
import dotenv from "dotenv";

dotenv.config();

const API_URL = "http://localhost:4000/api/auth";

async function testRegistration() {
    await mongoose.connect(process.env.MONGO_URI);

    // 1. Create a Referrer manually
    const referrerCode = "TESTREF" + Math.floor(Math.random() * 1000);
    const referrer = await User.create({
        phone: "999" + Math.floor(Math.random() * 10000000),
        password: "password",
        referralCode: referrerCode,
        role: "user"
    });
    console.log(`Referrer created: ${referrer.phone} (Code: ${referrerCode})`);

    // 2. Register a new user via API with inviteCode
    const newUserPhone = "888" + Math.floor(Math.random() * 10000000);
    const payload = {
        phone: newUserPhone,
        password: "password123",
        pass2: "password123", // Frontend sends this but backend might not need it
        inviteCode: referrerCode
    };

    console.log("Registering new user via API...", payload);

    try {
        const res = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log("API Response:", data);

        if (data.success) {
            // 3. Verify in Database
            const newUser = await User.findOne({ phone: newUserPhone });
            if (newUser && newUser.referredBy === referrerCode) {
                console.log("✅ SUCCESS: User registered and referredBy is set correctly.");
                console.log(`User: ${newUser.phone}, ReferredBy: ${newUser.referredBy}`);
            } else {
                console.log("❌ FAILURE: referredBy mismatch or user not found.");
                console.log("User in DB:", newUser);
            }
        } else {
            console.log("❌ API Registration Failed");
        }
    } catch (err) {
        console.error("Error:", err);
    }

    process.exit();
}

testRegistration();
