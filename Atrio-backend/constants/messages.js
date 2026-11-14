const AUTH_MESSAGES = {
  EMAIL_PASSWORD_REQUIRED: "Email and password are required.",
  EMAIL_ALREADY_EXISTS: "An account with this email already exists.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  REGISTER_SUCCESS: "User registered successfully.",
  LOGIN_SUCCESS: "Logged in successfully.",
  NOT_AUTHORIZED: "Not authorized. Please log in.",
  USER_NOT_FOUND: "User not found.",
  INVALID_OR_EXPIRED_TOKEN: "Invalid or expired token. Please log in again.",
  EMAIL_NOT_REGISTERED: "Email not registered. Contact your manager.",
  OTP_SENT: "OTP sent to your email",
  INVALID_OTP: "Invalid or expired OTP.",
};

const GENERAL_MESSAGES = {
  VALIDATION_FAILED: "Validation failed.",
  SERVER_ERROR: "Server error.",
};

module.exports = {
  AUTH_MESSAGES,
  GENERAL_MESSAGES,
};
