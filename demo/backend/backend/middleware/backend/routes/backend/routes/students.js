const express = require("express");
const router  = express.Router();
const Student = require("../models/Student");
const Fee     = require("../models/Fee");
const { protect, adminOnly } = require("../middleware/auth");

const feeAmt = { "B.Tech":120000, "M.Tech":100000, MCA:80000, MBA:90000, BCA:60000 };

// GET /api/students  — get all
router.get("/", protect, async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json(students);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/students  — create
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const student = await Student.create(req.body);
    // Auto-create fee record
    await Fee.create({ studentId: student._id, paid: 0, total: feeAmt[student.course] || 80000 });
    res.status(201).json(student);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/students/:id  — update
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/students/:id
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    await Fee.deleteOne({ studentId: req.params.id });
    res.json({ message: "Student deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
