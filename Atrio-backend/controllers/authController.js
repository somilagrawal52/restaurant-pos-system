const User = require("../models/User");
const { sendSuccess, sendError } = require("../utils/response");
const { generateToken } = require("../utils/jwt");
const { sendOtpEmail } = require("../utils/email");
const HTTP_STATUS = require("../constants/httpStatus");
const { AUTH_MESSAGES, GENERAL_MESSAGES } = require("../constants/messages");

const OTP_EXPIRY_MINUTES = 5;

/**
 * Sanitize user for response (no password, consistent id).
 */
const toUserResponse = (user) => ({
  id: user._id,
  email: user.email,
  name: user.name || "",
  phone: user.phone ?? null,
  role: user.role || "waiter",
  restaurantId: user.restaurantId || null,
});

/**
 * Generate 6-digit OTP.
 */
function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Register a new user.
 * POST /auth/register
 */
const register = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, {
      message: AUTH_MESSAGES.EMAIL_PASSWORD_REQUIRED,
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return sendError(res, {
      message: AUTH_MESSAGES.EMAIL_ALREADY_EXISTS,
      statusCode: HTTP_STATUS.CONFLICT,
    });
  }

  const user = await User.create({ email, password });
  const token = generateToken(user._id);

  return sendSuccess(res, {
    data: {
      user: toUserResponse(user),
      token,
    },
    message: AUTH_MESSAGES.REGISTER_SUCCESS,
    statusCode: HTTP_STATUS.CREATED,
  });
};

/**
 * Login with email and password.
 * POST /auth/login
 */
const login = async (req, res, next) => {
  const { email, password } = req.body;
  console.log(email, password);

  if (!email || !password) {
    return sendError(res, {
      message: AUTH_MESSAGES.EMAIL_PASSWORD_REQUIRED,
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return sendError(res, {
      message: AUTH_MESSAGES.INVALID_CREDENTIALS,
      statusCode: HTTP_STATUS.UNAUTHORIZED,
    });
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return sendError(res, {
      message: AUTH_MESSAGES.INVALID_CREDENTIALS,
      statusCode: HTTP_STATUS.UNAUTHORIZED,
    });
  }

  const token = generateToken(user._id);

  return sendSuccess(res, {
    data: {
      user: toUserResponse(user),
      token,
    },
    message: AUTH_MESSAGES.LOGIN_SUCCESS,
  });
};

/**
 * Get current authenticated user.
 * GET /auth/me (requires auth)
 */
const getMe = async (req, res, next) => {
  return sendSuccess(res, {
    data: { user: toUserResponse(req.user) },
  });
};

/**
 * Update current user profile (name, phone). Admin only in practice; backend allows any authenticated user.
 * PATCH /auth/me
 * Body: { name?, phone? }
 */
const updateMe = async (req, res, next) => {
  const user = req.user;
  if (req.body.name !== undefined) user.name = String(req.body.name).trim() || "";
  if (req.body.phone !== undefined) user.phone = req.body.phone == null || String(req.body.phone).trim() === "" ? null : String(req.body.phone).trim();
  await user.save();
  return sendSuccess(res, {
    data: { user: toUserResponse(user) },
    message: "Profile updated",
  });
};

/**
 * Send OTP to email. Email must be registered.
 * POST /auth/send-otp
 * Body: { email }
 */
const sendOtp = async (req, res) => {
  const email = req.body.email?.toLowerCase?.()?.trim();
  if (!email) {
    return sendError(res, {
      message: "Email is required",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  const user = await User.findOne({ email }).select("+otpCode +otpExpiresAt");
  if (!user) {
    return sendError(res, {
      message: AUTH_MESSAGES.EMAIL_NOT_REGISTERED,
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  const code = generateOtp();
  console.log(`[DEV] OTP for ${email}: ${code}`);
  user.otpCode = code;
  user.otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  try {
    await sendOtpEmail(user.email, code);
  } catch (err) {
    console.warn("OTP email failed (non-fatal):", err.message);
  }

  return sendSuccess(res, {
    message: AUTH_MESSAGES.OTP_SENT,
  });
};

/**
 * Verify OTP and return JWT.
 * POST /auth/verify-otp
 * Body: { email, otp }
 */
const verifyOtp = async (req, res) => {
  const email = req.body.email?.toLowerCase?.()?.trim();
  const otp = req.body.otp?.trim?.();
  if (!email || !otp) {
    return sendError(res, {
      message: "Email and OTP are required",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  const user = await User.findOne({ email }).select("+otpCode +otpExpiresAt");
  if (!user) {
    return sendError(res, {
      message: AUTH_MESSAGES.INVALID_CREDENTIALS,
      statusCode: HTTP_STATUS.UNAUTHORIZED,
    });
  }

  if (!user.otpCode || user.otpExpiresAt < new Date()) {
    return sendError(res, {
      message: AUTH_MESSAGES.INVALID_OTP,
      statusCode: HTTP_STATUS.UNAUTHORIZED,
    });
  }

  if (user.otpCode !== otp) {
    return sendError(res, {
      message: AUTH_MESSAGES.INVALID_OTP,
      statusCode: HTTP_STATUS.UNAUTHORIZED,
    });
  }

  user.otpCode = undefined;
  user.otpExpiresAt = undefined;
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);
  return sendSuccess(res, {
    data: {
      user: toUserResponse(user),
      token,
    },
    message: AUTH_MESSAGES.LOGIN_SUCCESS,
  });
};

module.exports = {
  register,
  login,
  getMe,
  updateMe,
  sendOtp,
  verifyOtp,
};
