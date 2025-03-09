const refreshTokenSchema = require("../models/refreshToken.schema");
const userModel = require("../models/user.model");
const generateToken = require("../utils/generateToken");
const logger = require("../utils/logger");
const {
  registerValidator,
  loginValidator,
} = require("../validation/validation");

// USER REGISTRATION

const registerUser = async (req, res) => {
  logger.info("Registration is starting");
  try {
    const { error } = registerValidator(req.body);
    if (error) {
      logger.warn(
        "Validation error in user registration",
        error.details[0].message
      );
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { email, username, password } = req.body;
    let user = await userModel.findOne({ $or: [{ email }, { username }] });

    if (user) {
      logger.warn("User already exist");
      return res.status(400).json({
        success: false,
        message: "User already exist",
      });
    }

    user = new userModel({ username, email, password });
    await user.save();
    logger.warn("User saved successfully", user._id);
    const { accessToken, refreshToken } = await generateToken(user);
    res.status(200).json({
      success: true,
      message: "User registered successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Registration error occured");
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// USER LOGIN

const login = async (req, res) => {
  logger.info("login is starting");
  try {
    const { error } = loginValidator(req.body);
    if (error) {
      logger.warn("Validation error in user login", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { email, password } = req.body;
    let user = await userModel.findOne({ email });
    if (!user) {
      logger.warn("User not found");
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const passwordChecker = await user.comparePassword(password);
    if (!passwordChecker) {
      logger.warn("Invalid password");
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    const { accessToken, refreshToken } = await generateToken(user);

    res.status(200).json({
      message: "Successfully logged in",
      success: true,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.warn("Login error occured : " + error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// USER REFRESH TOKEN

const refreshToken = async (req, res) => {
  logger.info("Refresh token is starting");
  try {
    const bodyToken = req.body;
    const token = await refreshTokenSchema.findOne({ token: bodyToken });
    if (!token || token.expiresAt < new Date()) {
      logger.warn("Invalid or expired refresh token");
    }

    const user = await userModel.findOne({ _id: token.user._id });

    if (!user) {
      logger.warn("User not found");
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const { accessToken, refreshToken } = await generateToken(user);
    await refreshTokenSchema.deleteOne({ _id: token._id });

    res.status(200).json({
      success: true,
      message: "Refresh token successfully created",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.warn("refresh token error occured : " + error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// USER LOGOUT

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token is missing");
      res.status(400).json({
        message: "Refresh token is missing",
        success: false,
      });
    }

    await refreshTokenSchema.deleteOne({ token: refreshToken });

    logger.info("Logged out successfully");
    res.status(400).json({
      message: "Logged out successfully",
      success: true,
    });
  } catch (error) {
    logger.warn("logout error occured : " + error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
module.exports = { registerUser, login, refreshToken, logout };
