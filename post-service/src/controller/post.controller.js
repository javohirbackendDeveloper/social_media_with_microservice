const postModel = require("../model/post.model");
const logger = require("../utils/logger");
const { createPostValidator } = require("../validation/validation");

const invalidatePostCache = async (req, input) => {
  const cacheKey = `post:${input}`;
  await req.redisClient.del(cacheKey);
  const keys = await req.redisClient.keys("posts:*");
  if (keys.length > 0) {
    await req.redisClient.del(keys);
  }
};
const createPost = async (req, res) => {
  logger.info("Creating post is starting");
  try {
    const { error } = createPostValidator(req.body);

    if (error) {
      logger.error("Validation error in createPostValidator");
      res.status(400).json({
        message: "Validation error in creatPOstValidator",
        success: false,
      });
    }

    const { content, mediaIds } = req.body;
    const createdPost = await postModel.create({
      content,
      mediaIds: mediaIds || [],
      user: req.user.userId,
    });

    await invalidatePostCache(req, createdPost);
    res.status(201).json({
      message: "Post created successfully",
      success: true,
    });
    logger.info("Post created successfully", createdPost);
  } catch (error) {
    logger.error("error in creating post", error.message);
    res.status(500).json({
      message: "Error in creating post",
      success: false,
    });
  }
};

const getPosts = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const startIndex = (page - 1) * limit;

    const cacheKey = `posts:${page}:${limit}`;
    const cachedPosts = await req.redisClient.get(cacheKey);

    if (cachedPosts) {
      return res.json(JSON.parse(cachedPosts));
    }

    const posts = await postModel
      .find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const total = await postModel.countDocuments();

    const result = {
      posts,
      currentpage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
    };
    await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));

    res.json({
      result,
    });
  } catch (error) {
    logger.error("error in getting post", error.message);
    res.status(500).json({
      message: "Error in getting post",
      success: false,
    });
  }
};

const getOnePost = async (req, res) => {
  try {
    const { id } = req.params;

    const cacheKey = `post:${id}`;
    const cachedPost = await req.redisClient.get(cacheKey);
    if (cachedPost) {
      return res.json(JSON.parse(cachedPost));
    }

    const gettedPost = await postModel.findById(id);

    if (!gettedPost) {
      return res.json({
        message: "This post not found",
        success: false,
      });
    }

    await req.redisClient.setex(cacheKey, 300, gettedPost);

    res.json({ gettedPost });
  } catch (error) {
    logger.error("Error in get one post");
    res.json({
      message: error.message,
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await postModel.findOneAndDelete({ _id: id });

    if (!post) {
      return res.json({
        message: "This post not found",
        success: false,
      });
    }

    await invalidatePostCache(req, id);

    res.json({
      message: "Post deleted successfully",
      success: true,
    });
  } catch (error) {
    logger.error("error in deleting post", error.message);
    res.status(500).json({
      message: "Error in deleting post",
      success: false,
    });
  }
};

module.exports = { createPost, getPosts, getOnePost, deletePost };
