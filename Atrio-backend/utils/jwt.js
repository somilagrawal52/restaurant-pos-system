const jwt = require("jsonwebtoken");

const JWT_ALGORITHM = "HS256";
const DEFAULT_EXPIRES_IN = "7d";

/**
 * Generates a JWT for the given user id (HS256).
 * @param {string} userId - Mongoose user _id
 * @returns {string} Signed token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    {
      algorithm: JWT_ALGORITHM,
      expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN,
    }
  );
};

/**
 * Verifies a JWT and returns the decoded payload.
 * @param {string} token
 * @returns {object} Decoded payload (e.g. { userId })
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
};

module.exports = {
  generateToken,
  verifyToken,
};
