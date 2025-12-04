import express from "express";
import { registerUser, loginUser, auth } from "../controller/authController.js";
import { authUser } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// ✔ protected route
router.get("/", authUser, auth);

export default router;
