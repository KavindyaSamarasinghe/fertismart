const express = require("express");
const router = express.Router();
const {
  listCrops,
  getCrop,
  createCrop,
  updateCrop,
  deleteCrop,
} = require("../controllers/cropController");
const { protect, authorize } = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Crops
 *   description: The 10 supported vegetable crops and their DOA/HORDI NPK standards
 */

/**
 * @swagger
 * /crops:
 *   get:
 *     summary: List all crops
 *     tags: [Crops]
 *     responses:
 *       200:
 *         description: List of all crops with NPK requirements
 */
router.get("/", protect, listCrops);

/**
 * @swagger
 * /crops/{id}:
 *   get:
 *     summary: Get a single crop by ID
 *     tags: [Crops]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Crop details
 *       404:
 *         description: Crop not found
 */
router.get("/:id", protect, getCrop);

/**
 * @swagger
 * /crops:
 *   post:
 *     summary: Add a new crop (Admin only)
 *     tags: [Crops]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, npkRequirementKgPerHa]
 *             properties:
 *               name: { type: string }
 *               scientificName: { type: string }
 *               npkRequirementKgPerHa:
 *                 type: object
 *                 properties:
 *                   n: { type: number }
 *                   p: { type: number }
 *                   k: { type: number }
 *               growingDurationDays: { type: number }
 *     responses:
 *       201:
 *         description: Crop created
 *       403:
 *         description: Forbidden — Admin role required
 */
router.post("/", protect, authorize("admin"), createCrop);

/**
 * @swagger
 * /crops/{id}:
 *   put:
 *     summary: Update an existing crop (Admin only)
 *     tags: [Crops]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Crop updated
 *       403:
 *         description: Forbidden — Admin role required
 *       404:
 *         description: Crop not found
 */
router.put("/:id", protect, authorize("admin"), updateCrop);

/**
 * @swagger
 * /crops/{id}:
 *   delete:
 *     summary: Delete a crop (Admin only)
 *     tags: [Crops]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Crop deleted
 *       403:
 *         description: Forbidden — Admin role required
 *       404:
 *         description: Crop not found
 */
router.delete("/:id", protect, authorize("admin"), deleteCrop);

module.exports = router;