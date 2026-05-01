const express  = require("express");
const router   = express.Router();
const mongoose = require("mongoose");
 
const feeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  paid:      { type: Number, default: 0 },
  total:     { type: Number, default: 80000 },
}, { timestamps: true });
 
const Fee = mongoose.models.Fee || mongoose.model("Fee", feeSchema);
 
router.get("/",            async (req, res) => { try { res.json(await Fee.find().populate("studentId")); } catch(e) { res.status(500).json({ message: e.message }); } });
router.get("/:studentId",  async (req, res) => { try { const f = await Fee.findOne({ studentId: req.params.studentId }).populate("studentId"); f ? res.json(f) : res.status(404).json({ message:"Not found" }); } catch(e) { res.status(500).json({ message: e.message }); } });
router.post("/",           async (req, res) => { try { res.status(201).json(await Fee.create(req.body)); } catch(e) { res.status(400).json({ message: e.message }); } });
router.put("/:studentId",  async (req, res) => { try { res.json(await Fee.findOneAndUpdate({ studentId: req.params.studentId }, req.body, { new: true })); } catch(e) { res.status(400).json({ message: e.message }); } });
 
module.exports = router;
 