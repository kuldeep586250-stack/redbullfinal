import express from "express";
import { authUser } from "../middleware/auth.js";
import { getProfile, updateProfile, getTeam } from "../controller/userController.js";

const router = express.Router();

router.get("/profile", authUser, getProfile);
router.put("/profile", authUser, updateProfile);
router.get("/team", authUser, getTeam);

export default router;
