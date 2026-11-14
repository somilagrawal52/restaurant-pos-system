const express = require("express");
const customerController = require("../controllers/customerController");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management and history APIs
 */

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Search customers
 *     description: Search customers by name, phone number or email.
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: false
 *         description: Search text for name, phone or email
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         description: Number of customers per page
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       email:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

router.get(
  "/",
  requireAuth,
  requireRole("admin", "manager"),
  asyncHandler(customerController.search),
);

/**
 * @swagger
 * /customers/{customerId}/history:
 *   get:
 *     summary: Get customer history
 *     description: Fetch reservation or visit history of a customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the customer
 *     responses:
 *       200:
 *         description: Customer history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customerId:
 *                   type: string
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       reservationId:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       table:
 *                         type: string
 *                       status:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Customer not found
 */

router.get(
  "/:customerId/history",
  requireAuth,
  requireRole("admin", "manager"),
  asyncHandler(customerController.history),
);

module.exports = router;
