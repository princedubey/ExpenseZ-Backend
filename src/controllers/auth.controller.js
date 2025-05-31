const admin = require('../config/firebase.config');
const User = require('../models/user.model');
const {
  generateTokenPair,
  verifyRefreshToken,
  clearRefreshToken,
} = require('../services/token.service');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Create user
    user = await User.create({
      name,
      email,
      password,
    });

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokenPair(user._id);

    res.status(201).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        currency: user.currency,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokenPair(user._id);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        currency: user.currency,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Google login
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, name, picture, sub: googleId } = decodedToken;

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        name,
        avatar: picture,
        googleId,
        isGoogleUser: true,
      });
    } else if (!user.isGoogleUser) {
      // Link existing account with Google
      user.googleId = googleId;
      user.isGoogleUser = true;
      user.avatar = picture;
      await user.save();
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokenPair(user._id);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        currency: user.currency,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const user = await User.findOne({ refreshToken }).select('+refreshToken');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    const isValid = await verifyRefreshToken(user._id, refreshToken);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired',
      });
    }

    // Generate new token pair
    const tokens = await generateTokenPair(user._id);

    res.json({
      success: true,
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    await clearRefreshToken(req.user.id);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        currency: user.currency,
      },
    });
  } catch (error) {
    next(error);
  }
}; 