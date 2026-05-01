import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  date:    { type: String, required: true },
  type:    { type: String, enum: ["student","faculty"], required: true },
  records: [{ id: mongoose.Schema.Types.ObjectId, status: String }],
}, { timestamps: true });

export default mongoose.model("Attendance", attendanceSchema);
