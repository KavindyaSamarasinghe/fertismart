const express = require("express");
const router = express.Router();
const {
  generateRecommendation,
  myRecommendations,
  pendingRecommendations,
  reviewRecommendation,
  downloadRecommendationPdf,
} = require("../controllers/recommendationController");
const { protect, authorize } = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Recommendations
 *   description: Simplex LP-generated, weather-adjusted fertilizer recommendations
 */

/**
 * @swagger
 * /recommendations:
 *   post:
 *     summary: Generate a new cost-minimized fertilizer recommendation
 *     tags: [Recommendations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [farmId, cropId]
 *             properties:
 *               farmId: { type: string }
 *               cropId: { type: string }
 *               rainfallMmOverride: { type: number, example: 80 }
 *     responses:
 *       201:
 *         description: Recommendation generated (status set to pending_review)
 *       403:
 *         description: Forbidden — Farmer/Officer role required, or farm not owned by user
 *       422:
 *         description: No feasible fertilizer combination found
 */
router.post("/", protect, authorize("farmer", "officer"), generateRecommendation);

/**
 * @swagger
 * /recommendations/mine:
 *   get:
 *     summary: List the logged-in farmer's own recommendations
 *     tags: [Recommendations]
 *     responses:
 *       200:
 *         description: List of the farmer's recommendation history
 *       403:
 *         description: Forbidden — Farmer role required
 */
router.get("/mine", protect, authorize("farmer"), myRecommendations);

/**
 * @swagger
 * /recommendations/pending:
 *   get:
 *     summary: List all recommendations awaiting Officer review
 *     tags: [Recommendations]
 *     responses:
 *       200:
 *         description: List of pending_review recommendations
 *       403:
 *         description: Forbidden — Officer role required
 */
router.get("/pending", protect, authorize("officer"), pendingRecommendations);

/**
 * @swagger
 * /recommendations/{id}/review:
 *   patch:
 *     summary: Approve or reject a pending recommendation (Officer only)
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [decision]
 *             properties:
 *               decision: { type: string, enum: [approved, rejected] }
 *               reviewNotes: { type: string }
 *     responses:
 *       200:
 *         description: Recommendation updated with review decision
 *       400:
 *         description: Invalid decision value
 *       403:
 *         description: Forbidden — Officer role required
 *       404:
 *         description: Recommendation not found
 */
router.patch("/:id/review", protect, authorize("officer"), reviewRecommendation);

/**
 * @swagger
 * /recommendations/{id}/pdf:
 *   get:
 *     summary: Download an approved recommendation as a PDF
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF file stream
 *         content:
 *           application/pdf: {}
 *       400:
 *         description: Recommendation has not been approved yet
 *       403:
 *         description: Forbidden — not the owning farmer, an officer, or an admin
 *       404:
 *         description: Recommendation not found
 */
router.get("/:id/pdf", protect, authorize("farmer", "officer", "admin"), downloadRecommendationPdf);

module.exports = router;