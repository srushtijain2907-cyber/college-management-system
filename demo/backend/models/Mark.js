import mongoose from "mongoose";

const markSchema = new mongoose.Schema({
  student:  { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  subjects: { type: Map, of: Number },
}, { timestamps: true });

export default mongoose.model("Mark", markSchema);
