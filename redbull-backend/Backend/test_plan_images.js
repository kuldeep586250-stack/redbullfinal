import mongoose from "mongoose";
import Plan from "./model/Plan.js";
import { createPlan } from "./controller/planController.js";

async function runTest() {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/Redbull");
        console.log("Connected to DB");

        // Cleanup existing plans to start fresh sequence check (optional, but cleaner)
        // actually, the count includes existing plans, so we just need to see if it increments
        const startCount = await Plan.countDocuments();
        console.log(`Starting plan count: ${startCount}`);

        const baseMockRes = {
            json: (data) => data
        };

        const createdImages = [];

        for (let i = 0; i < 10; i++) {
            const req = {
                body: {
                    name: `Test Plan ${i}`,
                    price: 100 + i,
                    daily: 10,
                    days: 30,
                    type: "buy",
                    isVip: false
                }
            };

            // We need to call createPlan but we can't easily capture the response in this structure 
            // without modifying controller or using a real mock.
            // Let's just create directly via Mongoose using the same logic as controller to validte the logic? 
            // No, we should test the controller logic itself.
            // But controller uses `randomImages` (or now headers) which is local to the module.
            // We'll mimic the request and mock res.

            let capturedData;
            const res = {
                json: (data) => { capturedData = data; }
            };

            await createPlan(req, res);
            if (capturedData.success) {
                createdImages.push(capturedData.plan.image);
            }
        }

        console.log("Created Images:");
        createdImages.forEach((img, idx) => {
            console.log(`${idx + 1}: ${img}`);
        });

        // Verify uniqueness in sequence
        let fails = 0;
        for (let i = 1; i < createdImages.length; i++) {
            if (createdImages[i] === createdImages[i - 1]) {
                console.log(`❌ FAIL: Consecutive duplicate at index ${i}: ${createdImages[i]}`);
                fails++;
            }
        }

        if (fails === 0) {
            console.log("✅ SUCCESS: No consecutive duplicates found in 10 creations.");
        }

        // Cleanup
        await Plan.deleteMany({ name: { $regex: /Test Plan/ } });
        console.log("Cleanup done.");

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

runTest();
