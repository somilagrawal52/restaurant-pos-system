const express = require("express");
const floorCategoryController = require("../controllers/floorCategoryController");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: FloorCategories
 *   description: Floor category management (Admin, Manager & Waiter)
 */

/**
 * @swagger
 * /floor-categories:
 *   get:
 *     summary: Get all floor categories
 *     tags: [FloorCategories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of floor categories
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin/Manager/Waiter only)
 */
router.get(
  "/",
  requireAuth,
  requireRole("admin", "manager", "waiter"),
  asyncHandler(floorCategoryController.list),
);
/**
 * @swagger
 * /floor-categories:
 *   post:
 *     summary: Create a new floor category
 *     tags: [FloorCategories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Premium
 *               description:
 *                 type: string
 *                 example: VIP and premium seating floors
 *     responses:
 *       201:
 *         description: Floor category created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/",
  requireAuth,
  requireRole("admin", "manager", "waiter"),
  asyncHandler(floorCategoryController.create),
);
/**
 * @swagger
 * /floor-categories/{id}:
 *   patch:
 *     summary: Update a floor category
 *     tags: [FloorCategories]
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
 *                 example: Standard
 *               description:
 *                 type: string
 *                 example: Normal seating floors
 *     responses:
 *       200:
 *         description: Floor category updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Category not found
 */
router.patch(
  "/:id",
  requireAuth,
  requireRole("admin", "manager", "waiter"),
  asyncHandler(floorCategoryController.update),
);
/**
 * @swagger
 * /floor-categories/{id}:
 *   delete:
 *     summary: Delete a floor category
 *     tags: [FloorCategories]
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
 *         description: Floor category deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Category not found
 */
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin", "manager", "waiter"),
  asyncHandler(floorCategoryController.remove),
);

module.exports = router;
