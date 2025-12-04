import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  phone: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"   // ✔ default role always user
  },

  name: { type: String, default: "" },
  address: { type: String, default: "" },
  avatar: { type: String, default: "" },

  wallet: { type: Number, default: 0 },
  plans: { type: Array, default: [] },


  otp: { type: String, default: null },          // store generated OTP
  otpExpiry: { type: Date, default: null },


  referralCode: { type: String, unique: true },  // ⭐ your auto code
  referredBy: { type: String, default: null },     // ⭐ who referred
  hasPurchasedPlan: { type: Boolean, default: false } // To track first purchase
}, { timestamps: true });

export default mongoose.model("User", userSchema);
