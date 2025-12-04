import fetch from 'node-fetch';

const API = "http://localhost:4000/api/plans";

const plans = [
    { name: "Daily Starter", price: 520, daily: 120, days: 47, type: "buy", isVip: false },
    { name: "Daily Saver", price: 960, daily: 210, days: 85, type: "buy", isVip: false },
    { name: "VIP Silver", price: 47800, daily: 19920, days: 130, type: "buy", isVip: true }
];

async function seed() {
    for (const p of plans) {
        try {
            const res = await fetch(API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(p)
            });
            const data = await res.json();
            console.log(`Seeded ${p.name}:`, data.success);
        } catch (e) {
            console.error(`Failed to seed ${p.name}:`, e.message);
        }
    }
}

seed();
