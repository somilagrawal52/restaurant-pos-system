const express = require("express");
const router = express.Router();
const shiftController = require("../controllers/shiftController");
const { requireAuth } = require("../middleware/auth");

router.get("/current", requireAuth, shiftController.getCurrentShift);
router.post("/open", requireAuth, shiftController.openShift);
router.post("/:id/pay-in", requireAuth, shiftController.recordPayIn);
router.post("/:id/pay-out", requireAuth, shiftController.recordPayOut);
router.post("/:id/close", requireAuth, shiftController.closeShift);

module.exports = router;
