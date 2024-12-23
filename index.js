import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import route from "./routes/userRoute.js";
import { logger, morganStream } from "./config/logger.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 7000;

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => logger.info("Database connected successfully."))
  .catch((error) => {
    logger.error("Database connection failed:", error);
    process.exit(1);
  });

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://ignite-employee-system-frontend.vercel.app/",
  ],
  methods: ["*"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Middleware
app.use(helmet());
app.use(morgan("combined", { stream: morganStream }));
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "public", "uploads"))
);

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Documentation",
      version: "1.0.0",
      description: "API documentation for the application",
    },
    servers: [{ url: `http://localhost:${PORT}/api` }],
  },
  apis: ["./routes/*.js"],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api", route);

// 404 Handler
app.use((req, res, next) => {
  logger.warn(`404 - Resource Not Found - ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: "Resource not found",
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error("Server Error:", {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Start Server
const server = app.listen(PORT, () => {
  logger.info(`Server is running on port: ${PORT}`);
});

// Graceful Shutdown
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

function gracefulShutdown() {
  logger.info("Server shutting down gracefully...");
  server.close(() => {
    mongoose.connection.close(false, (err) => {
      if (err) {
        logger.error("Error closing MongoDB connection during shutdown:", err);
      } else {
        logger.info("MongoDB connection closed.");
      }
      process.exit(0);
    });
  });
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", {
    message: error.message,
    stack: error.stack,
  });

  // Attempt graceful shutdown
  gracefulShutdown();
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection:", {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : "No stack available",
    promise,
  });

  // Attempt graceful shutdown
  gracefulShutdown();
});
