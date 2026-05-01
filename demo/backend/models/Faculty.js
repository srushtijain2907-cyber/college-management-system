import mongoose from "mongoose";

const facultySchema = new mongoose.Schema({
  name:   { type: String, required: true, trim: true },
  dept:   { type: String, required: true },
  exp:    { type: String },
  salary: { type: Number, default: 70000 },
}, { timestamps: true });

export default mongoose.model("Faculty", facultySchema);
