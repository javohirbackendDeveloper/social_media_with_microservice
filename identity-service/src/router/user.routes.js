const { Router } = require("express");
const {
  registerUser,
  login,
  refreshToken,
  logout,
} = require("../controllers/user.controller");

const userRouter = Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", login);
userRouter.post("/refreshToken", refreshToken);
userRouter.post("/logout", logout);

module.exports = userRouter;
