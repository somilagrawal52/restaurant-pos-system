const express = require("express");
const multer = require("multer");
const path = require("path");
const { requireAuth } = require("../middleware/auth");
const transcriptionController = require("../controllers/transcriptionController");

const router = express.Router();

// ── Multer setup for audio uploads ──
const upload = multer({
  dest: "/tmp",
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["audio/wav", "audio/mpeg", "audio/mp4", "audio/webm"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid audio format. Only WAV, MP3, MP4, WEBM allowed."));
    }
  },
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
  },
});

// ── Routes ──

/**
 * POST /api/transcription/transcribe
 * Transcribe audio to text using Groq Whisper
 */
router.post(
  "/transcribe",
  requireAuth,
  upload.single("audio"),
  transcriptionController.transcribeAudio
);

/**
 * POST /api/transcription/extract
 * Extract reservation data from transcript using Atrio-ASR
 */
router.post(
  "/extract",
  requireAuth,
  transcriptionController.extractReservationData
);

module.exports = router;
