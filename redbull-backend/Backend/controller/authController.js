import User from "../model/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SALT = 10;

const signToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Generate random referral code
const generateReferral = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// REGISTER
export const registerUser = async (req, res) => {
  try {
    const { phone, email, password, inviteCode } = req.body;

    if (!password || (!phone && !email)) {
      return res.json({
        success: false,
        message: "Phone/Email & password required",
      });
    }

    if (phone) {
      const exists = await User.findOne({ phone });
      if (exists)
        return res.json({ success: false, message: "Phone already exists" });
    }

    if (email) {
      const exists = await User.findOne({ email });
      if (exists)
        return res.json({ success: false, message: "Email already exists" });
    }

    // Hash password
    const hashPass = await bcrypt.hash(password, SALT);

    // Generate new user's referral code
    const myReferralCode = generateReferral();

    // Normalize invite code
    const validInviteCode = inviteCode ? inviteCode.toUpperCase().trim() : null;

    console.log(`[REGISTER] New User: ${phone || email}, InviteCode: ${validInviteCode}`);

    // Create new user
    const user = await User.create({
      phone: phone || null,
      email: email || null,
      password: hashPass,
      role: "user",
      referralCode: myReferralCode,
      referredBy: validInviteCode,
    });

    // -----------------------------
    // REFERRAL REWARD MOVED TO PAYMENT APPROVAL
    // -----------------------------
    // if (inviteCode) {
    //   const referrer = await User.findOne({ referralCode: inviteCode });
    //   if (referrer) {
    //      // Logic moved to paymentController
    //   }
    // }

    return res.json({
      success: true,
      message: "Registered successfully",
      referralCode: myReferralCode,
    });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

// LOGIN (email OR phone)
export const loginUser = async (req, res) => {
  try {
    const { user, password } = req.body;

    let u = await User.findOne({ phone: user });
    if (!u) u = await User.findOne({ email: user });

    if (!u) return res.json({ success: false, message: "User not found" });

    // check hash password
    let match = await bcrypt.compare(password, u.password);

    // fallback for OLD plain-text users
    if (!match && u.password === password) {
      match = true;
      const newHash = await bcrypt.hash(password, SALT);
      u.password = newHash;
      await u.save();
    }

    if (!match)
      return res.json({ success: false, message: "Invalid password" });

    const token = signToken(u);

    return res.json({
      success: true,
      message: "Login successful",
      token,
      role: u.role,
      user: {
        id: u._id,
        phone: u.phone,
        email: u.email,
        role: u.role,
        name: u.name,
        referralCode: u.referralCode, // ADD THIS
        wallet: u.wallet, // ADD THIS
      },
    });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

export const auth = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "phone email wallet referralCode"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};
