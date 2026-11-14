const express = require("express");
const router = express.Router();
const { scanReceipt, extractPaymentDetails, upload } = require("../controllers/ocrController");

router.post("/scan", upload.single("image"), scanReceipt);
router.post("/extract-payment", upload.single("image"), extractPaymentDetails);

module.exports = router;
