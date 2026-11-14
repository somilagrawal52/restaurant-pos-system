const express = require("express");
const floorController = require("../controllers/floorController");
const { requireAuth } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Floors
 *   description: Floor and section management
 */

/**
 * @swagger
 * /floors:
 *   get:
 *     summary: Get all floors
 *     tags: [Floors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of floors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Floor'
 */
router.get("/", asyncHandler(floorController.listFloors));
/**
 * @swagger
 * /floors:
 *   post:
 *     summary: Create a new floor
 *     tags: [Floors]
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
 *               - capacity
 *             properties:
 *               name:
 *                 type: string
 *               capacity:
 *                 type: number
 *     responses:
 *       201:
 *         description: Floor created successfully
 */
router.post("/", asyncHandler(floorController.createFloor));
/**
 * @swagger
 * /floors/{id}:
 *   delete:
 *     summary: Delete a floor
 *     tags: [Floors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Floor ID
 *     responses:
 *       200:
 *         description: Floor deleted successfully
 */
router.delete("/:id", asyncHandler(floorController.deleteFloor));

// ─── Sections ─────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /floors/{id}/sections:
 *   post:
 *     summary: Add section to a floor
 *     tags: [Floors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Floor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - tableCount
 *             properties:
 *               name:
 *                 type: string
 *               tableCount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Section added successfully
 */
router.post("/:id/sections", asyncHandler(floorController.addSection));
/**
 * @swagger
 * /floors/{id}/sections/{sectionId}:
 *   delete:
 *     summary: Delete section from floor
 *     tags: [Floors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Section deleted successfully
 */
router.delete(
  "/:id/sections/:sectionId",
  asyncHandler(floorController.deleteSection),
);

/**
 * @swagger
 * /floors/{id}/sections/{sectionId}:
 *   put:
 *     summary: Update section
 *     tags: [Floors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               tableCount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Section updated successfully
 */
router.put(
  "/:id/sections/:sectionId",
  asyncHandler(floorController.updateSection),
);
/**
 * @swagger
 * /floors/{id}/sections/{sectionId}/statuses:
 *   get:
 *     summary: Get table statuses
 *     tags: [Floors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of table statuses
 */
router.get(
  "/:id/sections/:sectionId/statuses",
  asyncHandler(floorController.listTableStatuses),
);
/**
 * @swagger
 * /floors/{id}/sections/{sectionId}/statuses:
 *   put:
 *     summary: Update table statuses
 *     tags: [Floors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 tableId:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: available
 *     responses:
 *       200:
 *         description: Table statuses updated successfully
 */
router.put(
  "/:id/sections/:sectionId/statuses",
  asyncHandler(floorController.updateTableStatuses),
);

module.exports = router;
