const express = require("express");
const router  = express.Router();
const Notice  = require("../models/Notice");
const { protect, adminOnly } = require("../middleware/auth");

// GET /api/notices
router.get("/", protect, async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.json(notices);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/notices
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const notice = await Notice.create(req.body);
    res.status(201).json(notice);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/notices/:id/read
router.put("/:id/read", protect, async (req, res) => {
  try {
    const notice = await Notice.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json(notice);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/notices/read-all
router.put("/read-all/mark", protect, async (req, res) => {
  try {
    await Notice.updateMany({}, { read: true });
    res.json({ message: "All notices marked as read" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/notices/:id
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ message: "Notice deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
