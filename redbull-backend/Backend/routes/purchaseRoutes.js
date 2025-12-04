import express from "express";
import { authUser } from "../middleware/auth.js";
import { buyPlan } from "../controller/purchaseController.js";

const router = express.Router();

router.post("/buy", authUser, buyPlan);

export default router;
