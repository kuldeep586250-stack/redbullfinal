import User from "../model/User.js";

// GET PROFILE
export const getProfile = async (req, res) => {
  return res.json({ success: true, user: req.user });
};

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const allowed = ["name", "address", "avatar"];
    const updatedData = {};

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updatedData[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updatedData, { new: true })
      .select("-password");

    return res.json({
      success: true,
      message: "Profile updated",
      user
    });

  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

// GET TEAM
export const getTeam = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.json({ success: false, message: "User not found" });

    // Helper to process a list of users and calculate stats
    const processLevel = (members) => {
      let recharge = 0;
      const processed = members.map(m => {
        let memberRecharge = 0;
        if (m.plans && m.plans.length > 0) {
          m.plans.forEach(p => {
            memberRecharge += (Number(p.amount) || Number(p.price) || 0);
          });
        }
        recharge += memberRecharge;
        return {
          name: m.name,
          phone: m.phone,
          email: m.email,
          createdAt: m.createdAt,
          plans: m.plans,
          wallet: m.wallet,
          totalRecharge: memberRecharge,
          referralCode: m.referralCode // needed for next level lookup (if we were doing it recursively in frontend, but we do it here)
        };
      });
      return { members: processed, recharge, size: members.length };
    };

    // LEVEL 1: Direct referrals
    console.log(`[TEAM] Fetching Level 1 for User: ${user.phone}, Code: ${user.referralCode}`);
    const level1Users = await User.find({ referredBy: user.referralCode }).sort({ createdAt: -1 });
    console.log(`[TEAM] Level 1 Found: ${level1Users.length}`);
    const level1Data = processLevel(level1Users);

    // LEVEL 2: Referred by Level 1
    const level1Codes = level1Users.map(u => u.referralCode).filter(Boolean);
    let level2Data = { members: [], recharge: 0, size: 0 };
    let level2Codes = [];

    if (level1Codes.length > 0) {
      const level2Users = await User.find({ referredBy: { $in: level1Codes } }).sort({ createdAt: -1 });
      console.log(`[TEAM] Level 2 Found: ${level2Users.length}`);
      level2Data = processLevel(level2Users);
      level2Codes = level2Users.map(u => u.referralCode).filter(Boolean);
    }

    // LEVEL 3: Referred by Level 2
    let level3Data = { members: [], recharge: 0, size: 0 };
    if (level2Codes.length > 0) {
      const level3Users = await User.find({ referredBy: { $in: level2Codes } }).sort({ createdAt: -1 });
      console.log(`[TEAM] Level 3 Found: ${level3Users.length}`);
      level3Data = processLevel(level3Users);
    }

    res.json({
      success: true,
      level1: level1Data,
      level2: level2Data,
      level3: level3Data
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
