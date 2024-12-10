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

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 7000;

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database connected successfully."))
  .catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  });
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://ignite-employee-system-frontend-3jaemuuqe.vercel.app/",
  ], // Allow these origins
  methods: ["*"], // Allow these methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allow these headers
  credentials: true, // Allow cookies and other credentials
};
// Middleware
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "common"));
app.use(cors(corsOptions));
//
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
  apis: ["./routes/*.js"], // Adjust path as necessary
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api", route);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Resource not found",
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});

// Graceful Shutdown
process.on("SIGINT", () => {
  console.log("Server shutting down gracefully...");
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed.");
      process.exit(0);
    });
  });
});
process.on("SIGTERM", () => {
  console.log("Server shutting down gracefully...");
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed.");
      process.exit(0);
    });
  });
});
