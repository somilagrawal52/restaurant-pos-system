const Groq = require("groq-sdk");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Lazy-load Groq client only when needed
let groq = null;

function getGroqClient() {
  if (!groq) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set in environment variables");
    }
    groq = new Groq({ apiKey });
  }
  return groq;
}

const BACKEND_URL = process.env.OCR_SERVICE_URL || "http://localhost:8000";

// ── Transcribe audio using Groq Whisper ──
exports.transcribeAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No audio file provided",
      });
    }

    const audioPath = req.file.path;
    const mimeType = req.file.mimetype || "audio/webm";
    const fileName = req.file.originalname || "audio.webm";

    // Transcribe using Groq Whisper
    const groqClient = getGroqClient();

    // Read file into memory
    const fileBuffer = fs.readFileSync(audioPath);

    // Create a File-like object with proper MIME type
    const audioFile = {
      buffer: fileBuffer,
      name: fileName,
      type: mimeType,
    };

    // Use fs.createReadStream with proper file extension detection
    const stream = fs.createReadStream(audioPath);
    stream.name = fileName;
    stream.type = mimeType;

    const transcription = await groqClient.audio.transcriptions.create({
      file: stream,
      model: "whisper-large-v3",
      language: "en",
      response_format: "text",
    });

    // Clean up temp file
    fs.unlinkSync(audioPath);

    const transcript =
      typeof transcription === "string" ? transcription : transcription.text;

    return res.status(200).json({
      success: true,
      transcript,
    });
  } catch (error) {
    console.error("Transcription error:", error);
    // Clean up temp file if it exists
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    }
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ── Extract entities from transcript using Atrio-ASR ──
exports.extractReservationData = async (req, res) => {
  try {
    const { transcript } = req.body;
    const authHeader = req.headers.authorization;

    if (!transcript) {
      return res.status(400).json({
        success: false,
        message: "Transcript is required",
      });
    }

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization header required",
      });
    }

    // Call Atrio-ASR backend to extract entities from transcript
    const extractionResponse = await axios.post(
      `${BACKEND_URL}/api/voice/extract`,
      { transcript },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        timeout: 30000,
      },
    );

    return res.status(200).json({
      success: true,
      transcript,
      extracted: extractionResponse.data.extracted,
      missing_fields: extractionResponse.data.missing_fields,
      missing_questions: extractionResponse.data.missing_questions,
      ready: extractionResponse.data.ready,
    });
  } catch (error) {
    console.error("Extraction error:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
