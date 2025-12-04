import jwt from "jsonwebtoken";
import User from "../model/User.js";

// ✔ COMMON USER AUTH
export const authUser = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Token missing" });
    }

    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.id).select("-password");
    if (!user)
      return res.status(401).json({ success: false, message: "User not found" });

    req.user = user; // attach full user object
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};


// ✔ ADMIN AUTH ONLY
export const authAdmin = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Token missing" });
    }

    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.id).select("-password");
    if (!user)
      return res.status(401).json({ success: false, message: "User not found" });

    if (user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Admin only." });
    }

    req.user = user;

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};
