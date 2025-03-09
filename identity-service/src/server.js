require("dotenv").config();
const mongoose = require("mongoose");
const logger = require("./utils/logger");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { RateLimiterRedis } = require("rate-limiter-flexible");
// const { corsConfigure } = require("./middleware/cors.configure");
const Redis = require("ioredis");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const userRouter = require("./router/user.routes");
const errorHandler = require("./middleware/errorHandler");
const app = express();
const PORT = process.env.PORT;

// mongodb connection

mongoose
  .connect(process.env.MONGOURI)
  .then(() => logger.info("Connected to database✅"))
  .catch((error) => logger.error("Mongodb connection error", error));

const redisClient = new Redis(process.env.REDIS_URL);
// middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body ${req.body}`);
  next();
});

// RATE LIMITING AND PROTECTING FROM DDOS ATTACKS

const rateLimiterRedis = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10,
  duration: 1,
});

app.use((req, res, next) => {
  rateLimiterRedis
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      logger.warn(`Rate limit exeeded for IP : ${req.ip}`);
      res.status(429).json({
        success: false,
        message: "Too many requests ,try again after some minutes",
      });
    });
});

const ratelimitSensitiveEndpoint = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exeeded for IP : ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many requests ,try again after some minutes",
    });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

// USING RATE LIMITER IN URLS

app.use("/api/auth/register", ratelimitSensitiveEndpoint);

app.use("/api/auth", userRouter);

// error handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info("Server is running on the " + PORT);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandler error at ", promise, "reason : ", reason);
});
