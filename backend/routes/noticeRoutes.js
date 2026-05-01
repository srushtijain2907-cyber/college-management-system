const express  = require("express");
const router   = express.Router();
const mongoose = require("mongoose");
 
const noticeSchema = new mongoose.Schema({
  title:    String,
  date:     String,
  category: { type: String, default: "General" },
  content:  { type: String, default: "" },
  read:     { type: Boolean, default: false },
}, { timestamps: true });
 
const Notice = mongoose.models.Notice || mongoose.model("Notice", noticeSchema);
 
router.get("/",      async (req, res) => { try { res.json(await Notice.find().sort({ date: -1 })); } catch(e) { res.status(500).json({ message: e.message }); } });
router.get("/:id",   async (req, res) => { try { const n = await Notice.findById(req.params.id); n ? res.json(n) : res.status(404).json({ message:"Not found" }); } catch(e) { res.status(500).json({ message: e.message }); } });
router.post("/",     async (req, res) => { try { res.status(201).json(await Notice.create(req.body)); } catch(e) { res.status(400).json({ message: e.message }); } });
router.put("/:id",   async (req, res) => { try { res.json(await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch(e) { res.status(400).json({ message: e.message }); } });
router.delete("/:id",async (req, res) => { try { await Notice.findByIdAndDelete(req.params.id); res.json({ message:"Deleted" }); } catch(e) { res.status(500).json({ message: e.message }); } });
 
module.exports = router;