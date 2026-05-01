const express  = require("express");
const router   = express.Router();
const mongoose = require("mongoose");
 
const markSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  subjects:  { type: Map, of: Number, default: {} },
}, { timestamps: true });
 
const Mark = mongoose.models.Mark || mongoose.model("Mark", markSchema);
 
router.get("/",            async (req, res) => { try { res.json(await Mark.find().populate("studentId")); } catch(e) { res.status(500).json({ message: e.message }); } });
router.get("/:studentId",  async (req, res) => { try { const m = await Mark.findOne({ studentId: req.params.studentId }).populate("studentId"); m ? res.json(m) : res.status(404).json({ message:"Not found" }); } catch(e) { res.status(500).json({ message: e.message }); } });
router.post("/",           async (req, res) => { try { res.status(201).json(await Mark.create(req.body)); } catch(e) { res.status(400).json({ message: e.message }); } });
router.put("/:studentId",  async (req, res) => { try { res.json(await Mark.findOneAndUpdate({ studentId: req.params.studentId }, req.body, { new: true })); } catch(e) { res.status(400).json({ message: e.message }); } });
 
module.exports = router;