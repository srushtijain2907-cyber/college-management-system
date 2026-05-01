import mongoose from "mongoose";

const feeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  paid:    { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Fee", feeSchema);
