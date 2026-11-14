const axios = require("axios");
const FormData = require("form-data");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

const scanReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const form = new FormData();
    form.append("image", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const ocrRes = await axios.post(
      `${process.env.OCR_SERVICE_URL}/api/ocr/process`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 30000,
      },
    );

    return res.status(200).json({
      success: true,
      data: ocrRes.data.data,
    });
  } catch (err) {
    console.error("OCR Service Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "OCR service failed",
      error: err.message,
    });
  }
};

// ── Extract payment details from payment screenshot ──
const extractPaymentDetails = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No payment screenshot provided" });
    }

    const form = new FormData();
    // Create a readable stream directly from buffer
    const { Readable } = require("stream");
    const stream = Readable.from(req.file.buffer);

    form.append("image", stream, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    // Call ASR backend OCR endpoint to extract payment details
    const asr_url = process.env.OCR_SERVICE_URL || "http://localhost:8000";

    console.log(
      `[extractPaymentDetails] Calling ASR endpoint: ${asr_url}/api/ocr/extract-payment`,
    );
    console.log(
      `[extractPaymentDetails] File: ${req.file.originalname}, Size: ${req.file.buffer.length} bytes`,
    );

    const ocrRes = await axios.post(
      `${asr_url}/api/ocr/extract-payment`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: req.headers.authorization,
        },
        timeout: 30000,
      },
    );

    console.log(`[extractPaymentDetails] ASR response:`, ocrRes.data);

    return res.status(200).json({
      success: true,
      amount: ocrRes.data.amount || null,
      transaction_id: ocrRes.data.transaction_id || null,
      timestamp: ocrRes.data.timestamp || null,
      payment_method: ocrRes.data.payment_method || null,
    });
  } catch (err) {
    console.error("[extractPaymentDetails] Error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      config: {
        url: err.config?.url,
        method: err.config?.method,
      },
    });
    return res.status(500).json({
      success: false,
      message: "Payment extraction failed",
      error: err.message,
      details: err.response?.data,
    });
  }
};

module.exports = { scanReceipt, extractPaymentDetails, upload };
