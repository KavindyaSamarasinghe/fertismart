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
