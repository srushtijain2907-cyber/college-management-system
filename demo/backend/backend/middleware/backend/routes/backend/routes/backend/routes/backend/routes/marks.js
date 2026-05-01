const express = require("express");
const router  = express.Router();
const Mark    = require("../models/Mark");
const { protect, adminOnly } = require("../middleware/auth");

// GET /api/marks  — all marks
router.get("/", protect, async (req, res) => {
  try {
    const marks = await Mark.find().populate("studentId", "name course");
    res.json(marks);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/marks/:studentId
router.get("/:studentId", protect, async (req, res) => {
  try {
    const mark = await Mark.findOne({ studentId: req.params.studentId });
    res.json(mark || { subjects: {} });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/marks  — create or update marks for a student
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { studentId, subjects } = req.body;
    const mark = await Mark.findOneAndUpdate(
      { studentId },
      { studentId, subjects },
      { new: true, upsert: true }
    );
    res.status(201).json(mark);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
