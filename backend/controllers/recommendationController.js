const Recommendation = require("../models/Recommendation");
const Farm = require("../models/Farm");
const Crop = require("../models/Crop");
const Fertilizer = require("../models/Fertilizer");
const { solveFertilizerMix } = require("../utils/lpSolver");
const { classifyRainfall, fetchRainfallMm } = require("../utils/rainfall");
const {
  computeStraightFertilizerBaseline,
  computeCompoundBaseline,
  computeSavings,
} = require("../utils/baselineComparison");

exports.generateRecommendation = async (req, res) => {
  try {
    const { farmId, cropId, rainfallMmOverride } = req.body;
    if (!farmId || !cropId) {
      return res.status(400).json({ message: "farmId and cropId are required" });
    }

    const farm = await Farm.findById(farmId);
    if (!farm) return res.status(404).json({ message: "Farm not found" });
    if (String(farm.farmer) !== String(req.user._id) && req.user.role === "farmer") {
      return res.status(403).json({ message: "You do not have access to this farm" });
    }

    const crop = await Crop.findById(cropId);
    if (!crop || !crop.isActive) {
      return res.status(404).json({ message: "Crop not found" });
    }

    const fertilizers = await Fertilizer.find({ isActive: true });
    if (fertilizers.length === 0) {
      return res.status(400).json({ message: "No active fertilizers configured in the system" });
    }

    const rainfallMm = await fetchRainfallMm(farm.region, rainfallMmOverride);
    const { class: rainfallClass, multiplier } = classifyRainfall(rainfallMm);

    const adjustedRequirement = {
      n: Math.round(crop.npkRequirementKgPerHa.n * multiplier * 100) / 100,
      p: crop.npkRequirementKgPerHa.p,
      k: crop.npkRequirementKgPerHa.k,
    };

    const scaledRequirement = {
      n: Math.round(adjustedRequirement.n * farm.areaHectares * 100) / 100,
      p: Math.round(adjustedRequirement.p * farm.areaHectares * 100) / 100,
      k: Math.round(adjustedRequirement.k * farm.areaHectares * 100) / 100,
    };

    const solverResult = solveFertilizerMix(fertilizers, scaledRequirement);

    if (solverResult.status === "infeasible") {
      return res.status(422).json({
        message:
          "No feasible fertilizer combination was found for this crop with the currently " +
          "configured fertilizers. Consider adding fertilizers with higher nutrient content.",
        rainfallClass,
        adjustedRequirementKgPerHa: adjustedRequirement,
      });
    }

    // Baseline comparison: what unoptimized, conventional fertilizer
    // application would have cost for the same nutrient requirement. The
    // compound baseline (a single general-purpose fertilizer applied at a
    // flat rate) is used as the primary comparison, since it best reflects
    // typical practice without a decision-support tool. The straight-
    // fertilizer baseline is also computed and included for completeness /
    // discussion, but is not used for the stored savings figure, since it
    // can coincide exactly with the LP optimum when straight fertilizers
    // are already the cheapest source per nutrient in the catalogue.
    const compoundBaseline = computeCompoundBaseline(fertilizers, scaledRequirement);
    const straightBaseline = computeStraightFertilizerBaseline(fertilizers, scaledRequirement);

    const { savingsLKR, savingsPercent } = compoundBaseline.feasible
      ? computeSavings(solverResult.totalCostLKR, compoundBaseline.totalCostLKR)
      : { savingsLKR: null, savingsPercent: null };

    const recommendation = await Recommendation.create({
      farmer: req.user.role === "farmer" ? req.user._id : farm.farmer,
      farm: farm._id,
      crop: crop._id,
      rainfallClass,
      nitrogenLeachingMultiplier: multiplier,
      adjustedRequirementKgPerHa: adjustedRequirement,
      fertilizerMix: solverResult.mix.map((m) => ({
        fertilizer: m.fertilizerId,
        fertilizerName: m.fertilizerName,
        quantityKg: m.quantityKg,
        costLKR: m.costLKR,
      })),
      totalCostLKR: solverResult.totalCostLKR,
      solverStatus: solverResult.status,
      baselineCostLKR: compoundBaseline.feasible ? compoundBaseline.totalCostLKR : null,
      savingsLKR,
      savingsPercent,
      status: "pending_review",
    });

    res.status(201).json({
      recommendation,
      baseline: {
        compound: compoundBaseline,
        straight: straightBaseline,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to generate recommendation", error: err.message });
  }
};

exports.myRecommendations = async (req, res) => {
  const recs = await Recommendation.find({ farmer: req.user._id })
    .populate("crop", "name")
    .populate("farm", "farmName region areaHectares")
    .sort({ createdAt: -1 });
  res.json({ recommendations: recs });
};

exports.pendingRecommendations = async (req, res) => {
  const recs = await Recommendation.find({ status: "pending_review" })
    .populate("crop", "name")
    .populate("farmer", "name email region")
    .populate("farm", "farmName region areaHectares")
    .sort({ createdAt: 1 });
  res.json({ recommendations: recs });
};

exports.reviewRecommendation = async (req, res) => {
  try {
    const { decision, reviewNotes } = req.body;
    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ message: "decision must be 'approved' or 'rejected'" });
    }

    const recommendation = await Recommendation.findById(req.params.id);
    if (!recommendation) return res.status(404).json({ message: "Recommendation not found" });

    recommendation.status = decision;
    recommendation.reviewedBy = req.user._id;
    recommendation.reviewNotes = reviewNotes || "";
    recommendation.reviewedAt = new Date();
    await recommendation.save();

    res.json({ recommendation });
  } catch (err) {
    res.status(500).json({ message: "Failed to review recommendation", error: err.message });
  }
};