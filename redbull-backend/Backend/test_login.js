// import fetch from "node-fetch"; // Using native fetch

const login = async () => {
    try {
        const res = await fetch("http://localhost:4000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user: "9876543212",
                password: "password123"
            })
        });

        const data = await res.json();
        console.log("Login Response:", data);
    } catch (err) {
        console.error("Login Failed:", err.message);
    }
};

login();
