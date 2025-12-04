import User from "../model/User.js";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";

// SEND OTP
export const sendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.json({ success: false, message: "Email not registered" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpiry = Date.now() + 60 * 1000; // 1 minute
    await user.save();

    // Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      to: email,
      subject: "Redbull Fiacre Password Resat Otp ",
      text: `Your OTP is: ${otp}`
    });

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Server error" });
  }
};

// VERIFY OTP
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.json({ success: false, message: "Email not registered" });

    if (user.otp !== otp)
      return res.json({ success: false, message: "Invalid OTP" });

    if (Date.now() > user.otpExpiry)
      return res.json({ success: false, message: "OTP expired" });

    res.json({ success: true, message: "OTP verified" });
  } catch {
    res.json({ success: false, message: "Server error" });
  }
};

// RESET PASSWORD
export const resetPassword = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user)
      return res.json({ success: false, message: "Email not found" });

    // Hash new password
    const hashedPass = await bcrypt.hash(password, 10);

    // update password
    user.password = hashedPass;

    // clear otp
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Server error" });
  }
};
