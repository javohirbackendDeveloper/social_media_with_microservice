require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const { RedisStore } = require("rate-limit-redis");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const { rateLimit } = require("express-rate-limit");
const Redis = require("ioredis");
const mediaRouter = require("./router/media.routes");

const app = express();
const PORT = process.env.PORT;

mongoose
  .connect(process.env.MONGOURI)
  .then(() => logger.info("Connected to mongodb"))
  .catch((e) => logger.error("Mongo connection error", e));

const redisClient = new Redis(process.env.REDIS_URL);

// middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body ${req.body}`);
  next();
});

// RATE LIMITING

const rateLimitOptions = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10,
  duration: 1,
});

app.use((req, res, next) => {
  rateLimitOptions
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
app.use("/api/media/upload", ratelimitSensitiveEndpoint);

app.use("/api/media", mediaRouter);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info("Server is running " + PORT);
});
