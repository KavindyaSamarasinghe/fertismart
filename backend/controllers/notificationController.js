const Recommendation = require("../models/Recommendation");

exports.getNotifications = async (req, res) => {
  try {
    const { role, _id } = req.user;
    let notifications = [];

    if (role === "farmer") {
      const recs = await Recommendation.find({
        farmer: _id,
        status: { $in: ["approved", "rejected"] },
        reviewedAt: { $ne: null },
      })
        .populate("crop", "name")
        .populate("farm", "farmName region")
        .sort({ reviewedAt: -1 })
        .limit(10);

      notifications = recs.map((r) => ({
        id: String(r._id),
        type: r.status,
        message: `Your ${r.crop?.name || "crop"} recommendation was ${r.status}`,
        detail: r.reviewNotes?.trim()
          ? `Officer note: ${r.reviewNotes.trim().slice(0, 80)}${r.reviewNotes.trim().length > 80 ? "..." : ""}`
          : r.farm?.farmName || r.farm?.region || "",
        createdAt: r.reviewedAt,
        link: "/farmer/recommendations",
      }));
    } else if (role === "officer") {
      const recs = await Recommendation.find({ status: "pending_review" })
        .populate("crop", "name")
        .populate("farmer", "name")
        .sort({ createdAt: -1 })
        .limit(10);

      notifications = recs.map((r) => ({
        id: String(r._id),
        type: "pending_review",
        message: `New pending review: ${r.crop?.name || "crop"}`,
        detail: r.farmer?.name || "",
        createdAt: r.createdAt,
        link: "/officer",
      }));
    } else if (role === "admin") {
      const pendingCount = await Recommendation.countDocuments({ status: "pending_review" });
      if (pendingCount > 0) {
        notifications = [
          {
            id: "admin-pending",
            type: "pending_review",
            message: `${pendingCount} recommendation${pendingCount === 1 ? "" : "s"} awaiting officer review`,
            detail: "",
            createdAt: new Date(),
            link: "/admin",
          },
        ];
      }
    }

    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: "Failed to load notifications", error: err.message });
  }
};