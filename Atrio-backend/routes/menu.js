const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuController");
const { requireAuth } = require("../middleware/auth");

router.get("/", menuController.getMenuItems);
router.post("/", requireAuth, menuController.createMenuItem);
router.patch("/:id", requireAuth, menuController.updateMenuItem);
router.patch("/:id/toggle-86", requireAuth, menuController.toggle86);

module.exports = router;
