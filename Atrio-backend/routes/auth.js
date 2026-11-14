const express = require("express");
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication APIs
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     description: Creates a new user account.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 example: staff@atrio.com
 *               role:
 *                 type: string
 *                 example: staff
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User already exists
 */
router.post("/register", asyncHandler(authController.register));
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login using OTP
 *     tags: [Auth]
 *     description: User logs in using email and OTP. Returns JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: staff@atrio.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             example:
 *               token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               user:
 *                 _id: 65a7c12b3a1b2c001f4d5678
 *                 email: staff@atrio.com
 *                 role: staff
 *       400:
 *         description: Invalid password
 *       401:
 *         description: User not authorized
 *       500:
 *         description: Server error
 */
router.post("/login", asyncHandler(authController.login));
// OTP-based auth endpoints are temporarily disabled.
// The implementation is kept in authController for future use.
// router.post("/send-otp", asyncHandler(authController.sendOtp));
// router.post("/verify-otp", asyncHandler(authController.verifyOtp));
/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current logged-in user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details
 *       401:
 *         description: Unauthorized
 */
router.get("/me", requireAuth, asyncHandler(authController.getMe));
/**
 * @swagger
 * /auth/me:
 *   patch:
 *     summary: Update current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: updated@atrio.com
 *               role:
 *                 type: string
 *                 example: admin
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         description: Unauthorized
 */
router.patch("/me", requireAuth, asyncHandler(authController.updateMe));

module.exports = router;
