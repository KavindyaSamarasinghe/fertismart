const mongoose = require("mongoose");

const RecommendationSchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", required: true },
    crop: { type: mongoose.Schema.Types.ObjectId, ref: "Crop", required: true },

    rainfallClass: {
      type: String,
      enum: ["low", "moderate", "heavy"],
      required: true,
    },
    nitrogenLeachingMultiplier: { type: Number, required: true },

    // Rainfall figure actually used, and where it came from. No default on
    // purpose: older records have no source and must not be labelled "live".
    rainfallMm: { type: Number },
    rainfallSource: { type: String, enum: ["live", "manual", "fallback"] },

    // Soil-type adjustment recorded for traceability
    soilType: { type: String, default: "" },
    soilAdjustmentApplied: { type: Boolean, default: false },
    soilMultipliers: {
      n: { type: Number, default: 1 },
      p: { type: Number, default: 1 },
      k: { type: Number, default: 1 },
    },
    soilNote: { type: String, default: "" },

    adjustedRequirementKgPerHa: {
      n: Number,
      p: Number,
      k: Number,
    },

    fertilizerMix: [
      {
        fertilizer: { type: mongoose.Schema.Types.ObjectId, ref: "Fertilizer" },
        fertilizerName: String,
        quantityKg: Number,
        costLKR: Number,
      },
    ],
    totalCostLKR: { type: Number, required: true },
    solverStatus: {
      type: String,
      enum: ["optimal", "infeasible", "unbounded"],
      default: "optimal",
    },

    // Baseline comparison: what an unoptimized, straight-fertilizer approach
    // would have cost for the same nutrient requirement, plus the resulting
    // savings from LP optimization. Null when no baseline could be computed
    // (e.g. no fertilizer available for one of the required nutrients).
    baselineCostLKR: { type: Number, default: null },
    savingsLKR: { type: Number, default: null },
    savingsPercent: { type: Number, default: null },

    status: {
      type: String,
      enum: ["pending_review", "approved", "rejected"],
      default: "pending_review",
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewNotes: { type: String, trim: true },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recommendation", RecommendationSchema);