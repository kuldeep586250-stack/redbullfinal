import express from "express";
import { authUser } from "../middleware/auth.js";
import { getTransactions } from "../controller/transactionController.js";

const router = express.Router();

router.get("/", authUser, getTransactions);

export default router;
