const logger = require("../utils/logger");

const checkAuth = (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      logger.warn("Access attempted without user ID");
      return res.status(401).json({
        message: "Authentication required. Please login to continue",
        success: false,
      });
    }

    req.user = { userId };

    next();
  } catch (error) {
    logger.error("Error in auth middleware");
    res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

module.exports = checkAuth;
