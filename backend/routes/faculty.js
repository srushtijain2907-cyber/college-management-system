const express  = require("express");
const router   = express.Router();
const mongoose = require("mongoose");
 
const facultySchema = new mongoose.Schema({
  name:   String,
  dept:   String,
  exp:    { type: String, default: "" },
  salary: { type: Number, default: 70000 },
}, { timestamps: true });
 
const Faculty = mongoose.models.Faculty || mongoose.model("Faculty", facultySchema);
 
router.get("/",       async (req, res) => { try { res.json(await Faculty.find()); } catch(e) { res.status(500).json({ message: e.message }); } });
router.get("/:id",    async (req, res) => { try { const f = await Faculty.findById(req.params.id); f ? res.json(f) : res.status(404).json({ message:"Not found" }); } catch(e) { res.status(500).json({ message: e.message }); } });
router.post("/",      async (req, res) => { try { res.status(201).json(await Faculty.create(req.body)); } catch(e) { res.status(400).json({ message: e.message }); } });
router.put("/:id",    async (req, res) => { try { res.json(await Faculty.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch(e) { res.status(400).json({ message: e.message }); } });
router.delete("/:id", async (req, res) => { try { await Faculty.findByIdAndDelete(req.params.id); res.json({ message:"Deleted" }); } catch(e) { res.status(500).json({ message: e.message }); } });
 
module.exports = router;
 
