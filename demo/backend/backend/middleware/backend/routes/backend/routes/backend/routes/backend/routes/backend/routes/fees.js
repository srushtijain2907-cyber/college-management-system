const express = require("express");
const router  = express.Router();
const Fee     = require("../models/Fee");
const { protect, adminOnly } = require("../middleware/auth");

// GET /api/fees
router.get("/", protect, async (req, res) => {
  try {
    const fees = await Fee.find().populate("studentId", "name course");
    res.json(fees);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/fees/:studentId/pay  — add payment
router.put("/:studentId/pay", protect, adminOnly, async (req, res) => {
  try {
    const { amount } = req.body;
    const fee = await Fee.findOne({ studentId: req.params.studentId });
    if (!fee) return res.status(404).json({ message: "Fee record not found" });

    fee.paid = Math.min(fee.paid + Number(amount), fee.total);
    await fee.save();
    res.json(fee);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
