const express  = require("express");
const router   = express.Router();
const mongoose = require("mongoose");
 
const attendanceSchema = new mongoose.Schema({
  date:    String,
  type:    { type: String, enum: ["student","faculty"], default: "student" },
  records: [{ personId: mongoose.Schema.Types.ObjectId, status: { type: String, enum: ["P","A"] } }],
}, { timestamps: true });
 
const Attendance = mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
 
router.get("/",      async (req, res) => { try { res.json(await Attendance.find().sort({ date: -1 })); } catch(e) { res.status(500).json({ message: e.message }); } });
router.get("/:date", async (req, res) => { try { const a = await Attendance.findOne({ date: req.params.date }); a ? res.json(a) : res.status(404).json({ message:"Not found" }); } catch(e) { res.status(500).json({ message: e.message }); } });
router.post("/",     async (req, res) => { try { res.status(201).json(await Attendance.create(req.body)); } catch(e) { res.status(400).json({ message: e.message }); } });
router.put("/:id",   async (req, res) => { try { res.json(await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch(e) { res.status(400).json({ message: e.message }); } });
 
module.exports = router;
