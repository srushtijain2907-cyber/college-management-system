const express  = require("express");
const router   = express.Router();
const mongoose = require("mongoose");
 
const studentSchema = new mongoose.Schema({
  name:   String,
  course: String,
  year:   String,
  phone:  { type: String, default: "" },
  email:  { type: String, default: "" },
  status: { type: String, default: "Active" },
}, { timestamps: true });
 
const Student = mongoose.models.Student || mongoose.model("Student", studentSchema);
 
router.get("/",        async (req, res) => { try { res.json(await Student.find()); } catch(e) { res.status(500).json({ message: e.message }); } });
router.get("/:id",     async (req, res) => { try { const s = await Student.findById(req.params.id); s ? res.json(s) : res.status(404).json({ message:"Not found" }); } catch(e) { res.status(500).json({ message: e.message }); } });
router.post("/",       async (req, res) => { try { res.status(201).json(await Student.create(req.body)); } catch(e) { res.status(400).json({ message: e.message }); } });
router.put("/:id",     async (req, res) => { try { res.json(await Student.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch(e) { res.status(400).json({ message: e.message }); } });
router.delete("/:id",  async (req, res) => { try { await Student.findByIdAndDelete(req.params.id); res.json({ message:"Deleted" }); } catch(e) { res.status(500).json({ message: e.message }); } });
 
module.exports = router;