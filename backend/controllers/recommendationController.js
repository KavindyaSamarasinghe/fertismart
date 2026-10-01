const PDFDocument = require("pdfkit");
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

const formatLKR = (n) =>
  `Rs. ${Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-LK", { day: "numeric", month: "long", year: "numeric" }) : "—";

/**
 * Streams a one-page PDF summary of an approved recommendation. Only the
 * owning Farmer, the reviewing Officer, or an Admin may download it; a
 * recommendation that has not yet been approved cannot be downloaded, since
 * an unreviewed or rejected plan should not be presented as something a
 * farmer can act on.
 */
exports.downloadRecommendationPdf = async (req, res) => {
  try {
    const rec = await Recommendation.findById(req.params.id)
      .populate("crop", "name")
      .populate("farm", "farmName region areaHectares")
      .populate("farmer", "name email")
      .populate("reviewedBy", "name");

    if (!rec) return res.status(404).json({ message: "Recommendation not found" });

    // Optional chaining: avoids a TypeError if the farmer's user document was deleted
    const isOwner =
      req.user.role === "farmer" && String(rec.farmer?._id) === String(req.user._id);
    const isStaff = req.user.role === "officer" || req.user.role === "admin";
    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: "You do not have access to this recommendation" });
    }

    if (rec.status !== "approved") {
      return res.status(400).json({ message: "Only approved recommendations can be downloaded as PDF" });
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="FertiSmart-Recommendation-${rec._id}.pdf"`
    );
    doc.pipe(res);

    const GREEN = "#1C3D20";
    const GREY = "#64748B";
    const LIGHT = "#F1F5F9";

    // Header
    doc.fillColor(GREEN).fontSize(20).font("Helvetica-Bold").text("FertiSmart SL", 50, 50);
    doc.fillColor(GREY).fontSize(9).font("Helvetica")
      .text("Linear Programming \u00B7 Weather-Adjusted \u00B7 Cost-Minimized", 50, 74);
    doc.moveTo(50, 95).lineTo(545, 95).strokeColor(LIGHT).lineWidth(1.5).stroke();

    // Title + status
    doc.fillColor("#0F172A").fontSize(16).font("Helvetica-Bold")
      .text("Fertilizer Recommendation", 50, 112);
    doc.fillColor(GREEN).fontSize(9).font("Helvetica-Bold")
      .text("APPROVED", 460, 116, { width: 85, align: "right" });

    doc.fillColor(GREY).fontSize(9).font("Helvetica")
      .text(`Recommendation ID: ${rec._id}`, 50, 136)
      .text(`Generated: ${formatDate(rec.createdAt)}    Approved: ${formatDate(rec.reviewedAt)}`, 50, 150);

    // Farmer / Farm / Crop summary box
    let y = 175;
    doc.roundedRect(50, y, 495, 70, 4).fillColor(LIGHT).fill();
    doc.fillColor("#0F172A").fontSize(9).font("Helvetica-Bold");
    const col = [60, 220, 380];
    doc.text("Farmer", col[0], y + 12).text("Crop", col[1], y + 12).text("Farm", col[2], y + 12);
    doc.font("Helvetica").fontSize(10).fillColor("#334155");
    doc.text(rec.farmer?.name || "—", col[0], y + 27, { width: 150 });
    doc.text(rec.crop?.name || "—", col[1], y + 27, { width: 150 });
    doc.text(
      `${rec.farm?.farmName || rec.farm?.region || "—"}\n${rec.farm?.areaHectares ?? "—"} ha, ${rec.farm?.region || "—"}`,
      col[2], y + 27, { width: 150 }
    );

    // Rainfall + nitrogen adjustment
    y += 90;
    doc.fillColor("#0F172A").fontSize(11).font("Helvetica-Bold").text("Weather Adjustment", 50, y);
    y += 18;
    doc.font("Helvetica").fontSize(9.5).fillColor("#334155");
    doc.text(
      `Rainfall classification: ${rec.rainfallClass || "—"}  (nitrogen multiplier \u00D7${rec.nitrogenLeachingMultiplier ?? "—"})`,
      50, y
    );
    y += 14;
    doc.text(
      `Adjusted requirement: N ${rec.adjustedRequirementKgPerHa?.n ?? "—"} / P ${rec.adjustedRequirementKgPerHa?.p ?? "—"} / K ${rec.adjustedRequirementKgPerHa?.k ?? "—"} kg/ha`,
      50, y
    );

    // Fertilizer mix table
    y += 32;
    doc.fillColor("#0F172A").fontSize(11).font("Helvetica-Bold").text("Fertilizer Mix", 50, y);
    y += 20;

    const tableX = 50, tableW = 495;
    const colW = [240, 120, 135];
    doc.roundedRect(tableX, y, tableW, 22, 3).fillColor(GREEN).fill();
    doc.fillColor("#FFFFFF").fontSize(9).font("Helvetica-Bold");
    doc.text("Fertilizer", tableX + 10, y + 7);
    doc.text("Quantity", tableX + colW[0] + 10, y + 7, { width: colW[1] - 10, align: "right" });
    doc.text("Cost", tableX + colW[0] + colW[1] + 10, y + 7, { width: colW[2] - 20, align: "right" });
    y += 22;

    (rec.fertilizerMix || []).forEach((item, i) => {
      const rowH = 20;
      if (i % 2 === 1) {
        doc.rect(tableX, y, tableW, rowH).fillColor(LIGHT).fill();
      }
      doc.fillColor("#334155").fontSize(9.5).font("Helvetica");
      doc.text(item.fertilizerName, tableX + 10, y + 6, { width: colW[0] - 10 });
      doc.text(`${item.quantityKg} kg`, tableX + colW[0] + 10, y + 6, { width: colW[1] - 10, align: "right" });
      doc.text(formatLKR(item.costLKR), tableX + colW[0] + colW[1] + 10, y + 6, { width: colW[2] - 20, align: "right" });
      y += rowH;
    });

    doc.roundedRect(tableX, y, tableW, 26, 3).fillColor(LIGHT).fill();
    doc.fillColor(GREEN).fontSize(10).font("Helvetica-Bold");
    doc.text("Total Estimated Cost", tableX + 10, y + 8);
    doc.text(formatLKR(rec.totalCostLKR), tableX + colW[0] + colW[1] + 10, y + 8, { width: colW[2] - 20, align: "right" });
    y += 26;

    // Savings callout
    if (typeof rec.savingsLKR === "number" && rec.savingsLKR > 0) {
      y += 14;
      doc.roundedRect(50, y, 495, 36, 4).fillColor("#EAF3EC").fill();
      doc.fillColor(GREEN).fontSize(10).font("Helvetica-Bold").text(
        `Saved ${formatLKR(rec.savingsLKR)} (${rec.savingsPercent?.toFixed(1)}%) versus conventional flat-rate application`,
        60, y + 11, { width: 475 }
      );
      y += 36;
    }

    // Officer approval
    y += 22;
    doc.moveTo(50, y).lineTo(545, y).strokeColor(LIGHT).lineWidth(1).stroke();
    y += 14;
    doc.fillColor("#0F172A").fontSize(10).font("Helvetica-Bold").text("Reviewed and Approved By", 50, y);
    y += 16;
    doc.fillColor("#334155").fontSize(9.5).font("Helvetica")
      .text(`${rec.reviewedBy?.name || "Agricultural Officer"}  \u00B7  ${formatDate(rec.reviewedAt)}`, 50, y);
    if (rec.reviewNotes) {
      y += 16;
      doc.fillColor(GREY).fontSize(9).font("Helvetica-Oblique")
        .text(`"${rec.reviewNotes}"`, 50, y, { width: 495 });
    }

    // Footer
    doc.fillColor(GREY).fontSize(8).font("Helvetica")
      .text(
        "This recommendation was generated by FertiSmart SL using Simplex linear programming against DOA/HORDI nutrient standards, and reviewed by a qualified Agricultural Officer before issue.",
        50, 760, { width: 495, align: "center" }
      );

    doc.end();
  } catch (err) {
    // If the PDF stream already started, headers are sent and we can't send JSON
    if (res.headersSent) {
      return res.end();
    }
    res.status(500).json({ message: "Failed to generate PDF", error: err.message });
  }
};