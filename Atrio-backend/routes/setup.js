const express = require("express");
const setupController = require("../controllers/setupController");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Setup
 *   description: Initial system setup APIs
 */

/**
 * @swagger
 * /setup/admin:
 *   post:
 *     summary: Create initial admin user
 *     tags: [Setup]
 *     description: Creates the first admin user for the system. Should be used only once during initial setup.
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
 *                 example: admin@atrio.com
 *               password:
 *                 type: string
 *                 example: Admin@123
 *     responses:
 *       201:
 *         description: Admin user created successfully
 *       400:
 *         description: Validation error or admin already exists
 *       500:
 *         description: Server error
 */
router.post("/admin", asyncHandler(setupController.setupAdmin));

module.exports = router;
