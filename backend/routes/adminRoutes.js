const express = require("express");
const router = express.Router();
const { listUsers, createStaffUser, setUserStatus, getOverview } = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect, authorize("admin"));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: User management and system analytics (Admin only — all routes below require Admin role)
 */

/**
 * @swagger
 * /admin/overview:
 *   get:
 *     summary: System-wide recommendation analytics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Aggregated totals, cost/savings summary, and breakdowns by crop and region
 *       403:
 *         description: Forbidden — Admin role required
 */
router.get("/overview", getOverview);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: List all users
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of all Farmer, Officer, and Admin accounts
 *       403:
 *         description: Forbidden — Admin role required
 */
router.get("/users", listUsers);

/**
 * @swagger
 * /admin/users:
 *   post:
 *     summary: Provision a new Officer or Admin account
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string, format: password }
 *               role: { type: string, enum: [officer, admin] }
 *               assignedRegions:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       201:
 *         description: Staff account created
 *       403:
 *         description: Forbidden — Admin role required
 */
router.post("/users", createStaffUser);

/**
 * @swagger
 * /admin/users/{id}/status:
 *   patch:
 *     summary: Activate or deactivate a user account
 *     tags: [Admin]
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
 *             required: [isActive]
 *             properties:
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: User status updated
 *       403:
 *         description: Forbidden — Admin role required
 *       404:
 *         description: User not found
 */
router.patch("/users/:id/status", setUserStatus);

module.exports = router;