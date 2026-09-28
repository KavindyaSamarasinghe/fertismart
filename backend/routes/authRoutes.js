const express = require("express");
const router = express.Router();
const { register, login, getProfile } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Farmer registration and login
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new farmer account
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, region]
 *             properties:
 *               name: { type: string, example: "Farmer One" }
 *               email: { type: string, example: "farmerone@gmail.com" }
 *               password: { type: string, format: password, example: "Test@1234" }
 *               region: { type: string, enum: [Nuwara Eliya, Bandarawela] }
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Validation error or duplicate email
 */
router.post("/register", register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in and receive a JWT
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "farmer@fertismart.lk" }
 *               password: { type: string, format: password, example: "Farmer@123" }
 *     responses:
 *       200:
 *         description: Login successful, JWT returned
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the currently authenticated user's profile
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Not authenticated
 */
router.get("/me", protect, getProfile);

module.exports = router;