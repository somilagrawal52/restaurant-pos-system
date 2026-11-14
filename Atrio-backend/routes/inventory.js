const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, inventoryController.getInventory);
router.post("/", requireAuth, inventoryController.createInventoryItem);
router.patch("/:id/stock", requireAuth, inventoryController.updateStock);
router.get("/boms", requireAuth, inventoryController.getRecipeBOMs);
router.post("/boms", requireAuth, inventoryController.createRecipeBOM);

module.exports = router;
