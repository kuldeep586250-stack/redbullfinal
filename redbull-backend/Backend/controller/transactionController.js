import Transaction from "../model/Transaction.js";

export const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user.id })
            .sort({ date: -1 });

        res.json({ success: true, transactions });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
