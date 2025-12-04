import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  name: String,
  price: Number,
  daily: Number,
  days: Number,
  timerHours: Number,
  type: String,      // buy | timer
  isVip: Boolean,
  image: String
}, { timestamps: true });

export default mongoose.model("Plan", planSchema);
