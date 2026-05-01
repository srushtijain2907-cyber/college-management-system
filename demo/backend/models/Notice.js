import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  content:  { type: String },
  category: { type: String, enum: ["General","Exam","Event","Fee","Holiday"], default: "General" },
  date:     { type: String },
  read:     { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Notice", noticeSchema);
