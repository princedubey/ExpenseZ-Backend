const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user.model');

// Generate access token
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
};

// Generate refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

// Store refresh token in user document
const storeRefreshToken = async (userId, refreshToken) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  await User.findByIdAndUpdate(userId, {
    refreshToken: hashedToken,
    refreshTokenExpires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return hashedToken;
};

// Verify refresh token
const verifyRefreshToken = async (userId, refreshToken) => {
  const user = await User.findById(userId);
  if (!user || !user.refreshToken) return false;

  const hashedToken = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  if (hashedToken !== user.refreshToken) return false;
  if (Date.now() > user.refreshTokenExpires) return false;

  return true;
};

// Generate new token pair
const generateTokenPair = async (userId) => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken();
  await storeRefreshToken(userId, refreshToken);

  return {
    accessToken,
    refreshToken,
  };
};

// Clear refresh token
const clearRefreshToken = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    refreshToken: undefined,
    refreshTokenExpires: undefined,
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  verifyRefreshToken,
  generateTokenPair,
  clearRefreshToken,
}; 