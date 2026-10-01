const PDFDocument = require("pdfkit");
const Recommendation = require("../models/Recommendation");
const Farm = require("../models/Farm");
const Crop = require("../models/Crop");
const Fertilizer = require("../models/Fertilizer");
const User = require("../models/User");
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

/**
 * Review history / audit trail.
 * - Officers see only the recommendations THEY reviewed.
 * - Admins see every reviewed recommendation across all officers.
 * Query params (all optional): status=approved|rejected, search=<farmer name/email>,
 * from=YYYY-MM-DD, to=YYYY-MM-DD (filters on the review date).
 */
exports.reviewHistory = async (req, res) => {
  try {
    const { status, search, from, to } = req.query;

    const filter = { status: { $in: ["approved", "rejected"] } };

    if (req.user.role === "officer") filter.reviewedBy = req.user._id;
    if (["approved", "rejected"].includes(status)) filter.status = status;

    // Date range on reviewedAt (inclusive of the whole "to" day)
    if (from || to) {
      filter.reviewedAt = {};
      if (from) {
        const d = new Date(`${from}T00:00:00`);
        if (!Number.isNaN(d.getTime())) filter.reviewedAt.$gte = d;
      }
      if (to) {
        const d = new Date(`${to}T23:59:59.999`);
        if (!Number.isNaN(d.getTime())) filter.reviewedAt.$lte = d;
      }
      if (Object.keys(filter.reviewedAt).length === 0) delete filter.reviewedAt;
    }

    // Search by farmer name or email
    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(escaped, "i");
      const farmers = await User.find({ $or: [{ name: rx }, { email: rx }] }).select("_id");
      filter.farmer = { $in: farmers.map((f) => f._id) };
    }

    const recs = await Recommendation.find(filter)
      .populate("crop", "name")
      .populate("farmer", "name email region")
      .populate("farm", "farmName region areaHectares soilType")
      .populate("reviewedBy", "name")
      .sort({ reviewedAt: -1 })
      .limit(300);

    const approved = recs.filter((r) => r.status === "approved").length;

    res.json({
      recommendations: recs,
      summary: {
        total: recs.length,
        approved,
        rejected: recs.length - approved,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load review history", error: err.message });
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

    // Optional chaining avoids a TypeError if a referenced user document was deleted
    const userId = String(req.user._id);
    const isOwner = req.user.role === "farmer" && String(rec.farmer?._id) === userId;
    const isReviewingOfficer =
      req.user.role === "officer" && String(rec.reviewedBy?._id) === userId;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isReviewingOfficer && !isAdmin) {
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
    doc.on("error", () => {
      if (!res.writableEnded) res.end();
    });
    doc.pipe(res);

    const GREEN = "#1C3D20";
    const GREY = "#64748B";
    const LIGHT = "#F1F5F9";
    const DARK = "#0F172A";
    const BODY = "#334155";

    const LEFT = 50;
    const WIDTH = 495;
    const RIGHT = LEFT + WIDTH;
    const TOP = 50;
    const CONTENT_BOTTOM = 730; // reserves room for the footer
    const FOOTER_TEXT =
      "This recommendation was generated by FertiSmart SL using Simplex linear programming against DOA/HORDI nutrient standards, and reviewed by a qualified Agricultural Officer before issue.";

    let y = TOP;

    // Starts a new page if `needed` points of height don't fit above the footer zone
    const ensureSpace = (needed) => {
      if (y + needed > CONTENT_BOTTOM) {
        doc.addPage();
        y = TOP;
        return true;
      }
      return false;
    };

    // ---------- Header ----------
    doc.fillColor(GREEN).fontSize(20).font("Helvetica-Bold").text("FertiSmart SL", LEFT, 50);
    doc.fillColor(GREY).fontSize(9).font("Helvetica")
      .text("Linear Programming \u00B7 Weather-Adjusted \u00B7 Cost-Minimized", LEFT, 74);
    doc.moveTo(LEFT, 95).lineTo(RIGHT, 95).strokeColor(LIGHT).lineWidth(1.5).stroke();

    // ---------- Title + status ----------
    doc.fillColor(DARK).fontSize(16).font("Helvetica-Bold")
      .text("Fertilizer Recommendation", LEFT, 112);
    doc.fillColor(GREEN).fontSize(9).font("Helvetica-Bold")
      .text("APPROVED", 460, 116, { width: 85, align: "right" });

    doc.fillColor(GREY).fontSize(9).font("Helvetica")
      .text(`Recommendation ID: ${rec._id}`, LEFT, 136)
      .text(
        `Generated: ${formatDate(rec.createdAt)}    Approved: ${formatDate(rec.reviewedAt)}`,
        LEFT, 150
      );

    // ---------- Farmer / Crop / Farm summary box ----------
    y = 175;
    doc.roundedRect(LEFT, y, WIDTH, 70, 4).fillColor(LIGHT).fill();
    doc.fillColor(DARK).fontSize(9).font("Helvetica-Bold");
    const col = [60, 220, 380];
    doc.text("Farmer", col[0], y + 12).text("Crop", col[1], y + 12).text("Farm", col[2], y + 12);
    doc.font("Helvetica").fontSize(10).fillColor(BODY);
    doc.text(rec.farmer?.name || "\u2014", col[0], y + 27, { width: 150 });
    doc.text(rec.crop?.name || "\u2014", col[1], y + 27, { width: 150 });
    doc.text(
      `${rec.farm?.farmName || rec.farm?.region || "\u2014"}\n${rec.farm?.areaHectares ?? "\u2014"} ha, ${rec.farm?.region || "\u2014"}`,
      col[2], y + 27, { width: 150 }
    );

    // ---------- Weather adjustment ----------
    y += 90;
    doc.fillColor(DARK).fontSize(11).font("Helvetica-Bold").text("Weather Adjustment", LEFT, y);
    y += 18;
    doc.font("Helvetica").fontSize(9.5).fillColor(BODY);
    doc.text(
      `Rainfall classification: ${rec.rainfallClass || "\u2014"}  (nitrogen multiplier \u00D7${rec.nitrogenLeachingMultiplier ?? "\u2014"})`,
      LEFT, y
    );
    y += 14;
    doc.text(
      `Adjusted requirement: N ${rec.adjustedRequirementKgPerHa?.n ?? "\u2014"} / P ${rec.adjustedRequirementKgPerHa?.p ?? "\u2014"} / K ${rec.adjustedRequirementKgPerHa?.k ?? "\u2014"} kg/ha`,
      LEFT, y
    );

    // ---------- Fertilizer mix table ----------
    y += 32;
    ensureSpace(20 + 22 + 20);
    doc.fillColor(DARK).fontSize(11).font("Helvetica-Bold").text("Fertilizer Mix", LEFT, y);
    y += 20;

    const colW = [240, 120, 135];

    const drawTableHeader = () => {
      doc.roundedRect(LEFT, y, WIDTH, 22, 3).fillColor(GREEN).fill();
      doc.fillColor("#FFFFFF").fontSize(9).font("Helvetica-Bold");
      doc.text("Fertilizer", LEFT + 10, y + 7);
      doc.text("Quantity", LEFT + colW[0] + 10, y + 7, { width: colW[1] - 10, align: "right" });
      doc.text("Cost", LEFT + colW[0] + colW[1] + 10, y + 7, { width: colW[2] - 20, align: "right" });
      y += 22;
    };

    drawTableHeader();

    (rec.fertilizerMix || []).forEach((item, i) => {
      const rowH = 20;
      if (ensureSpace(rowH)) drawTableHeader(); // continue on a new page with a repeated header
      if (i % 2 === 1) {
        doc.rect(LEFT, y, WIDTH, rowH).fillColor(LIGHT).fill();
      }
      doc.fillColor(BODY).fontSize(9.5).font("Helvetica");
      doc.text(item.fertilizerName || "\u2014", LEFT + 10, y + 6, { width: colW[0] - 10, lineBreak: false });
      doc.text(`${item.quantityKg} kg`, LEFT + colW[0] + 10, y + 6, { width: colW[1] - 10, align: "right", lineBreak: false });
      doc.text(formatLKR(item.costLKR), LEFT + colW[0] + colW[1] + 10, y + 6, { width: colW[2] - 20, align: "right", lineBreak: false });
      y += rowH;
    });

    // ---------- Total ----------
    ensureSpace(26);
    doc.roundedRect(LEFT, y, WIDTH, 26, 3).fillColor(LIGHT).fill();
    doc.fillColor(GREEN).fontSize(10).font("Helvetica-Bold");
    doc.text("Total Estimated Cost", LEFT + 10, y + 8, { lineBreak: false });
    doc.text(formatLKR(rec.totalCostLKR), LEFT + colW[0] + colW[1] + 10, y + 8, {
      width: colW[2] - 20,
      align: "right",
      lineBreak: false,
    });
    y += 26;

    // ---------- Savings callout ----------
    if (typeof rec.savingsLKR === "number" && rec.savingsLKR > 0) {
      y += 14;
      ensureSpace(36);
      doc.roundedRect(LEFT, y, WIDTH, 36, 4).fillColor("#EAF3EC").fill();
      doc.fillColor(GREEN).fontSize(10).font("Helvetica-Bold").text(
        `Saved ${formatLKR(rec.savingsLKR)} (${Number(rec.savingsPercent ?? 0).toFixed(1)}%) versus conventional flat-rate application`,
        60, y + 11, { width: 475 }
      );
      y += 36;
    }

    // ---------- Officer approval ----------
    y += 22;
    ensureSpace(14 + 16 + 16);
    doc.moveTo(LEFT, y).lineTo(RIGHT, y).strokeColor(LIGHT).lineWidth(1).stroke();
    y += 14;
    doc.fillColor(DARK).fontSize(10).font("Helvetica-Bold").text("Reviewed and Approved By", LEFT, y);
    y += 16;
    doc.fillColor(BODY).fontSize(9.5).font("Helvetica")
      .text(
        `${rec.reviewedBy?.name || "Agricultural Officer"}  \u00B7  ${formatDate(rec.reviewedAt)}`,
        LEFT, y
      );
    y += 14;

    if (rec.reviewNotes) {
      // Measure first so long notes move to a new page instead of hitting the footer
      doc.fontSize(9).font("Helvetica-Oblique");
      const noteText = `"${rec.reviewNotes}"`;
      const noteH = doc.heightOfString(noteText, { width: WIDTH });
      y += 2;
      ensureSpace(noteH);
      doc.fillColor(GREY).text(noteText, LEFT, y, { width: WIDTH });
      y += noteH;
    }

    // ---------- Footer (always on the last page, below all content) ----------
    const FOOTER_H = 30;
    ensureSpace(FOOTER_H + 10);
    const footerY = 770;
    doc.page.margins.bottom = 0; // stops pdfkit from auto-adding a page for the footer
    doc.fillColor(GREY).fontSize(8).font("Helvetica")
      .text(FOOTER_TEXT, LEFT, footerY, { width: WIDTH, align: "center" });

    doc.end();
  } catch (err) {
    // If the PDF stream already started, headers are sent and we can't send JSON
    if (res.headersSent) {
      return res.end();
    }
    res.status(500).json({ message: "Failed to generate PDF", error: err.message });
  }
};