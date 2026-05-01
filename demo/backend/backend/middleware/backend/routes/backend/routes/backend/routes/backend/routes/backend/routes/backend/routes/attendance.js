const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  date:    { type: String, required: true },
  type:    { type: String, enum: ["student", "faculty"], default: "student" },
  records: [
    {
      personId: { type: mongoose.Schema.Types.ObjectId, refPath: "type" },
      status:   { type: String, enum: ["P", "A"], default: "A" },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model("Attendance", attendanceSchema);

