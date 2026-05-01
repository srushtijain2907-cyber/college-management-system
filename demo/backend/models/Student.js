import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name:   { type: String, required: true, trim: true },
  course: { type: String, required: true, enum: ["B.Tech","M.Tech","MCA","MBA","BCA"] },
  year:   { type: String, required: true, enum: ["1st","2nd","3rd","4th"] },
  phone:  { type: String, trim: true },
  email:  { type: String, trim: true, lowercase: true },
  status: { type: String, default: "Active" },
}, { timestamps: true });

export default mongoose.model("Student", studentSchema);
