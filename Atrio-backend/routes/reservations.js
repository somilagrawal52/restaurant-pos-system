const express = require("express");
const reservationController = require("../controllers/reservationController");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Reservations
 *   description: Reservation management (Admin, Manager & Waiter)
 */
/**
 * @swagger
 * /reservations:
 *   get:
 *     summary: Get all reservations
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of reservations
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin/Manager/Waiter only)
 */
router.get(
  "/",
  requireAuth,
  requireRole("admin", "manager", "waiter"),
  asyncHandler(reservationController.list),
);
/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: Create a new reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerName
 *               - date
 *               - time
 *               - guests
 *             properties:
 *               customerName:
 *                 type: string
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2026-03-01
 *               time:
 *                 type: string
 *                 example: "19:30"
 *               guests:
 *                 type: number
 *                 example: 4
 *               floorId:
 *                 type: string
 *                 example: 65a7c12b3a1b2c001f4d5678
 *     responses:
 *       201:
 *         description: Reservation created successfully
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
  asyncHandler(reservationController.create),
);
/**
 * @swagger
 * /reservations/{id}:
 *   patch:
 *     summary: Update a reservation
 *     tags: [Reservations]
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
 *               customerName:
 *                 type: string
 *                 example: Jane Doe
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2026-03-02
 *               time:
 *                 type: string
 *                 example: "20:00"
 *               guests:
 *                 type: number
 *                 example: 5
 *               status:
 *                 type: string
 *                 example: confirmed
 *     responses:
 *       200:
 *         description: Reservation updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Reservation not found
 */
router.patch(
  "/:id",
  requireAuth,
  requireRole("admin", "manager", "waiter"),
  asyncHandler(reservationController.update),
);
/**
 * @swagger
 * /reservations/{id}:
 *   delete:
 *     summary: Cancel a reservation
 *     tags: [Reservations]
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
 *         description: Reservation cancelled successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Reservation not found
 */
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin", "manager", "waiter"),
  asyncHandler(reservationController.cancel),
);

router.post(
  "/:id/verify-payment",
  requireAuth,
  requireRole("admin", "manager"),
  asyncHandler(reservationController.verifyPayment),
);

module.exports = router;
