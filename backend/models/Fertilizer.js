const mongoose = require("mongoose");

const FertilizerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    type: {
      type: String,
      enum: ["Nitrogen", "Phosphorus", "Potassium", "Compound"],
      required: true,
    },
    nutrientContentPercent: {
      n: { type: Number, required: true, min: 0, max: 100 },
      p: { type: Number, required: true, min: 0, max: 100 },
      k: { type: Number, required: true, min: 0, max: 100 },
    },
    costPerKgLKR: { type: Number, required: true, min: 0 },
    supplier: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Fertilizer", FertilizerSchema);
