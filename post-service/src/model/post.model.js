const { Schema, model, default: mongoose } = require("mongoose");

const postSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    content: {
      type: String,
      required: true,
    },
    mediaIds: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

postSchema.index({ content: "text" });

module.exports = model("Posts", postSchema);
