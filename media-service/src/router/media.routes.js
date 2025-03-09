const { Router } = require("express");
const multer = require("multer");
const checkAuth = require("../middleware/auth.middleware");
const { uploadFile } = require("../controller/media.controller");
const logger = require("../utils/logger");

const mediaRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single("file");

mediaRouter.post(
  "/upload",
  checkAuth,
  (req, res, next) => {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        logger.error("Multer error while uploading", err);
        return res.status(400).json({
          message: "Multer error while uploading",
          error: err.message,
          stack: err.stack,
        });
      } else if (err) {
        logger.error("Unknown error while uploading");
        return res.status(400).json({
          message: "Unknown error while uploading",
          error: err.message,
          stack: err.stack,
        });
      }

      if (!req.file) {
        logger.error("No file found");
        return res.status(400).json({
          message: "No file found",
        });
      }
      next();
    });
  },
  uploadFile
);
module.exports = mediaRouter;
