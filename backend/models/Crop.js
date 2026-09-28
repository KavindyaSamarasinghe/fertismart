const mongoose = require("mongoose");

/**
 * Crop reference data, sourced from DOA (Department of Agriculture) and
 * HORDI (Horticultural Research and Development Institute) nutrient
 * standards for up-country vegetable crops.
 */
const CropSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    scientificName: { type: String, trim: true },
    category: { type: String, default: "Up-country Vegetable" },
    npkRequirementKgPerHa: {
      n: { type: Number, required: true, min: 0 },
      p: { type: Number, required: true, min: 0 },
      k: { type: Number, required: true, min: 0 },
    },
    growingDurationDays: { type: Number },
    source: { type: String, default: "DOA/HORDI Fertilizer Recommendation Standards" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Crop", CropSchema);
