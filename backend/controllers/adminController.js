const User = require("../models/User");
const Recommendation = require("../models/Recommendation");

exports.listUsers = async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ users });
};

exports.createStaffUser = async (req, res) => {
  try {
    const { name, email, password, role, assignedRegions } = req.body;
    if (!["officer", "admin"].includes(role)) {
      return res.status(400).json({ message: "role must be 'officer' or 'admin'" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }
    const user = await User.create({ name, email, password, role, assignedRegions });
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(400).json({ message: "Failed to create staff user", error: err.message });
  }
};

exports.setUserStatus = async (req, res) => {
  const { isActive } = req.body;

  // Prevent an admin from locking themselves out
  if (String(req.params.id) === String(req.user._id) && isActive === false) {
    return res.status(400).json({ message: "You cannot deactivate your own account" });
  }

  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user: { id: user._id, name: user.name, isActive: user.isActive } });
};

/**
 * System-wide analytics for the Admin overview dashboard. Aggregates every
 * Recommendation document to summarize review-queue status, cost and
 * savings totals, and breakdowns by crop and region. Intentionally uses a
 * single populate + in-memory reduce, consistent with this codebase's
 * existing style, rather than a Mongo aggregation pipeline — dataset size
 * at this project's scale does not warrant the added complexity.
 */
exports.getOverview = async (req, res) => {
  const recs = await Recommendation.find({})
    .populate("crop", "name")
    .populate("farm", "region");

  const byStatus = { pending_review: 0, approved: 0, rejected: 0 };
  let totalCostLKR = 0;
  let totalSavingsLKR = 0;
  let savingsPercentSum = 0;
  let savingsCount = 0;
  const byCrop = {};
  const byRegion = {};

  recs.forEach((r) => {
    if (byStatus[r.status] !== undefined) byStatus[r.status] += 1;
    totalCostLKR += r.totalCostLKR || 0;

    if (typeof r.savingsLKR === "number" && r.savingsLKR !== null) {
      totalSavingsLKR += r.savingsLKR;
    }
    if (typeof r.savingsPercent === "number" && r.savingsPercent !== null) {
      savingsPercentSum += r.savingsPercent;
      savingsCount += 1;
    }

    const cropName = r.crop?.name || "Unknown crop";
    byCrop[cropName] = (byCrop[cropName] || 0) + 1;

    const region = r.farm?.region || "Unknown region";
    byRegion[region] = (byRegion[region] || 0) + 1;
  });

  res.json({
    totals: {
      recommendations: recs.length,
      pendingReview: byStatus.pending_review,
      approved: byStatus.approved,
      rejected: byStatus.rejected,
    },
    cost: {
      totalCostLKR: Math.round(totalCostLKR * 100) / 100,
      totalSavingsLKR: Math.round(totalSavingsLKR * 100) / 100,
      avgSavingsPercent:
        savingsCount > 0 ? Math.round((savingsPercentSum / savingsCount) * 100) / 100 : 0,
    },
    byCrop: Object.entries(byCrop)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    byRegion: Object.entries(byRegion).map(([name, count]) => ({ name, count })),
  });
};