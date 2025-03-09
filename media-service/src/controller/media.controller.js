const media = require("../model/media");
const { uploaderToCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");

const uploadFile = async (req, res) => {
  logger.info("Uploading file to cloudinary is starting");
  try {
    if (!req.file) {
      return res.json({
        message: "Any file is uploaded please upload a file",
        success: false,
      });
    }
    const { originalname, mimetype, buffer } = req.file;
    const userId = req.user.userId;

    const cloudinaryUploader = await uploaderToCloudinary(req.file);
    logger.info(
      `File uploaded successfuly uploaded to cloudinary.Public Id : ${cloudinaryUploader.public_id}`
    );

    const createdMedia = await media.create({
      originalName: originalname,
      mimeType: mimetype,
      publicId: cloudinaryUploader.public_id,
      url: cloudinaryUploader.secure_url,
      userId,
    });

    res.json({
      message: "MEdia created successfulyl",
      success: true,
      mediaId: createdMedia._id,
      url: createdMedia.url,
    });
  } catch (error) {
    console.log({ error });

    logger.error("Error in creating media");
    res.status(500).json({
      message: "Error in creating media",
      success: false,
    });
  }
};

module.exports = { uploadFile };
