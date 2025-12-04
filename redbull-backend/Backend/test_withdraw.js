// import fetch from "node-fetch";

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MzA5YmI2MWQ2NTc1YTI5MDFmMjBjYSIsImlhdCI6MTc2NDc5MzMyMSwiZXhwIjoxNzY1Mzk4MTIxfQ.5345N9hovFAZFx3N4t8mT9CpZAVW8FK1v_dNmp99irQ";

async function test() {
    try {
        console.log("Sending withdraw request...");
        const res = await fetch("http://localhost:4000/api/withdraw/request", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                amount: 500,
                bankName: "Test Script User",
                ifsc: "SCRIPT001",
                account: "999888777",
                mobile: "8888888888"
            })
        });

        const text = await res.text();
        console.log("Response Status:", res.status);
        console.log("Response Body:", text);

    } catch (e) {
        console.error("Error:", e);
    }
}

test();
