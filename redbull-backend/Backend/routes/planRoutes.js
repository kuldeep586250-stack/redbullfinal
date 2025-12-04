import express from "express";
import { authAdmin } from "../middleware/auth.js";
import {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan
} from "../controller/planController.js";

const router = express.Router();

// PUBLIC / FRONTEND
router.get("/", getPlans);

// ADMIN
router.post("/", authAdmin, createPlan);
router.put("/:id", authAdmin, updatePlan);
router.delete("/:id", authAdmin, deletePlan);

export default router;
