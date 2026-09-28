const express = require("express");
const router = express.Router();
const { createFarm, myFarms, listFarms } = require("../controllers/farmController");
const { protect, authorize } = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Farms
 *   description: Farmer-registered plots
 */

/**
 * @swagger
 * /farms:
 *   post:
 *     summary: Register a new farm (Farmer only)
 *     tags: [Farms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [farmName, region, areaHectares]
 *             properties:
 *               farmName: { type: string, example: "Test 1" }
 *               region: { type: string, enum: [Nuwara Eliya, Bandarawela] }
 *               areaHectares: { type: number, example: 2 }
 *               soilType: { type: string, example: "Reddish Brown Latosolic" }
 *     responses:
 *       201:
 *         description: Farm created
 *       403:
 *         description: Forbidden — Farmer role required
 */
router.post("/", protect, authorize("farmer"), createFarm);

/**
 * @swagger
 * /farms/mine:
 *   get:
 *     summary: List the logged-in farmer's own farms
 *     tags: [Farms]
 *     responses:
 *       200:
 *         description: List of the farmer's farms
 *       403:
 *         description: Forbidden — Farmer role required
 */
router.get("/mine", protect, authorize("farmer"), myFarms);

/**
 * @swagger
 * /farms:
 *   get:
 *     summary: List all farms (Officer/Admin only)
 *     tags: [Farms]
 *     responses:
 *       200:
 *         description: List of all farms across farmers
 *       403:
 *         description: Forbidden — Officer/Admin role required
 */
router.get("/", protect, authorize("officer", "admin"), listFarms);

module.exports = router;