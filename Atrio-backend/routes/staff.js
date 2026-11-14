const express = require("express");
const staffController = require("../controllers/staffController");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Staff
 *   description: Staff management APIs
 */

/**
 * @swagger
 * /staff:
 *   get:
 *     summary: Get all staff members
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of staff members
 *       401:
 *         description: Unauthorized
 */

router.get("/", requireAuth, asyncHandler(staffController.listStaff));
/**
 * @swagger
 * /staff:
 *   post:
 *     summary: Create a new staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
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
 *                 example: waiter@atrio.com
 *               role:
 *                 type: string
 *                 example: waiter
 *               name:
 *                 type: string
 *                 example: Rahul Sharma
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               restaurantId:
 *                 type: string
 *                 example: 65a7c12b3a1b2c001f4d5678
 *     responses:
 *       201:
 *         description: Staff created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin/Manager only)
 */
router.post(
  "/",
  requireAuth,
  requireRole("admin", "manager"),
  asyncHandler(staffController.createStaff),
);
/**
 * @swagger
 * /staff/{id}:
 *   patch:
 *     summary: Update staff member details
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 65a7c12b3a1b2c001f4d5678
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Name
 *               role:
 *                 type: string
 *                 example: manager
 *               phone:
 *                 type: string
 *                 example: "9999999999"
 *               restaurantId:
 *                 type: string
 *                 example: 65a7c12b3a1b2c001f4d5678
 *     responses:
 *       200:
 *         description: Staff updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Staff not found
 */
router.patch(
  "/:id",
  requireAuth,
  requireRole("admin", "manager"),
  asyncHandler(staffController.updateStaff),
);
/**
 * @swagger
 * /staff/{id}:
 *   delete:
 *     summary: Delete a staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 65a7c12b3a1b2c001f4d5678
 *     responses:
 *       200:
 *         description: Staff deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Staff not found
 */
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin", "manager"),
  asyncHandler(staffController.deleteStaff),
);

module.exports = router;
