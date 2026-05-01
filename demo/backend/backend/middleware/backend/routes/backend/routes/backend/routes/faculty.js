const express = require("express");
const router  = express.Router();
const Faculty = require("../models/Faculty");
const { protect, adminOnly } = require("../middleware/auth");

// GET /api/faculty
router.get("/", protect, async (req, res) => {
  try {
    const faculty = await Faculty.find().sort({ createdAt: -1 });
    res.json(faculty);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/faculty
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const faculty = await Faculty.create(req.body);
    res.status(201).json(faculty);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/faculty/:id
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!faculty) return res.status(404).json({ message: "Faculty not found" });
    res.json(faculty);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/faculty/:id
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await Faculty.findByIdAndDelete(req.params.id);
    res.json({ message: "Faculty deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
