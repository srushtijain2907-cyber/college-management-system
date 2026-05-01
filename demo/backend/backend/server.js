require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const mongoose = require("mongoose");
 
// ── Connect to MongoDB ───────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/cms_raisoni")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => { console.error("❌ MongoDB Error:", err.message); process.exit(1); });
 
// ── Import Routes (exact file names from your routes folder) ─
const authRoutes       = require("./routes/authRoutes");
const studentRoutes    = require("./routes/studentRoutes");
const facultyRoutes    = require("./routes/facultyRoutes");
const markRoutes       = require("./routes/markRoutes");
const feeRoutes        = require("./routes/feeRoutes");
const noticeRoutes     = require("./routes/noticeRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
 
const app = express();
 
// ── Middleware ───────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
 
// ── Routes ───────────────────────────────────────────────────
app.use("/api/auth",       authRoutes);
app.use("/api/students",   studentRoutes);
app.use("/api/faculty",    facultyRoutes);
app.use("/api/marks",      markRoutes);
app.use("/api/fees",       feeRoutes);
app.use("/api/notices",    noticeRoutes);
app.use("/api/attendance", attendanceRoutes);
 
// ── Health Check ─────────────────────────────────────────────
app.get("/", (req, res) => res.json({
  status: "✅ CMS Raisoni API Running",
  time: new Date()
}));
 
// ── 404 ──────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: "Route not found" }));
 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
 