import Plan from "../model/Plan.js";

// RANDOM IMAGE PICKER
const randomImages = [
  "Frontend/assets/images/ma.jpg",
  "Frontend/assets/images/mp.jpg",
  "Frontend/assets/images/re.jpg",
  "Frontend/assets/images/sa.jpg"
];

// GET ALL PLANS (admin & frontend)
export const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ createdAt: -1 });
    res.json({ success: true, plans });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// CREATE PLAN
export const createPlan = async (req, res) => {
  try {
    const {
      name,
      price,
      daily,
      days,
      timerHours,
      type,
      isVip
    } = req.body;

    if (!name) return res.json({ success: false, message: "Plan name required" });

    const img = randomImages[Math.floor(Math.random() * randomImages.length)];

    const plan = await Plan.create({
      name,
      price,
      daily,
      days,
      timerHours,
      type,
      isVip,
      image: img
    });

    res.json({ success: true, plan });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// UPDATE PLAN
export const updatePlan = async (req, res) => {
  try {
    const updated = await Plan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ success: true, plan: updated });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// DELETE PLAN
export const deletePlan = async (req, res) => {
  try {
    await Plan.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Plan deleted" });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};
