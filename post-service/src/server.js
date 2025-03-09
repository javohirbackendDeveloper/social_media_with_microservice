require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const logger = require("./utils/logger");
const { default: mongoose } = require("mongoose");
const Redis = require("ioredis");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const app = express();
const PORT = process.env.PORT;
const { rateLimit } = require("express-rate-limit");
const postRouter = require("./router/post.routes");
const errorHandler = require("./middleware/errorHandler");
const { RedisStore } = require("rate-limit-redis");

mongoose
  .connect(process.env.MONGOURI)
  .then(() => logger.info("Connected to database✅"))
  .catch((error) => logger.error("Mongodb connection error", error));

const redisClient = new Redis(process.env.REDIS_URL);

// MIDDLEWARE
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body ${req.body}`);
  next();
});

// RATE LIMIT

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

app.use("/api/post/create", ratelimitSensitiveEndpoint);

app.use(
  "/api/post",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  postRouter
);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info("Server is running " + PORT);
});
