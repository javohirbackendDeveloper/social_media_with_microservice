const { Router } = require("express");
const {
  createPost,
  getPosts,
  getOnePost,
  deletePost,
} = require("../controller/post.controller");
const checkAuth = require("../middleware/auth.middleware");

const postRouter = Router();

postRouter.use(checkAuth);

postRouter.post("/create", createPost);
postRouter.get("/getAllPosts", getPosts);
postRouter.get("/getOnePost/:id", getOnePost);
postRouter.delete("/deletePost/:id", deletePost);

module.exports = postRouter;
