const express = require("express");
const restaurantController = require("../controllers/restaurantController");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Restaurants
 *   description: Restaurant management APIs
 */

/**
 * @swagger
 * /restaurants:
 *   get:
 *     summary: Get all restaurants
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of restaurants
 *       401:
 *         description: Unauthorized
 */
router.get("/", requireAuth, asyncHandler(restaurantController.list));
/**
 * @swagger
 * /restaurants:
 *   post:
 *     summary: Create a new restaurant
 *     tags: [Restaurants]
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
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *                 example: Atrio Downtown
 *               address:
 *                 type: string
 *                 example: 123 Main Street, New York
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               email:
 *                 type: string
 *                 example: contact@atrio.com
 *     responses:
 *       201:
 *         description: Restaurant created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 */
router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  asyncHandler(restaurantController.create),
);
/**
 * @swagger
 * /restaurants/{id}:
 *   delete:
 *     summary: Delete a restaurant
 *     tags: [Restaurants]
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
 *         description: Restaurant deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Restaurant not found
 */
router.get(
  "/:id",
  requireAuth,
  requireRole("admin", "manager"),
  asyncHandler(restaurantController.getOne),
);

/**
 * @swagger
 * /restaurants/{id}:
 *   patch:
 *     summary: Update a restaurant
 *     description: Update restaurant information
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Restaurant ID
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
 *                 example: Atrio Downtown
 *               address:
 *                 type: string
 *                 example: 123 Main Street, New York
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               email:
 *                 type: string
 *                 example: contact@atrio.com
 *     responses:
 *       200:
 *         description: Restaurant updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Restaurant not found
 */

router.patch(
  "/:id",
  requireAuth,
  requireRole("admin", "manager"),
  asyncHandler(restaurantController.update),
);

/**
 * @swagger
 * /restaurants/{id}:
 *   delete:
 *     summary: Delete a restaurant
 *     tags: [Restaurants]
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
 *         description: Restaurant deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Restaurant not found
 */

router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(restaurantController.remove),
);

module.exports = router;
