import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";

// Load environment variables
dotenv.config();

// Log environment
console.log("ENV ", process.env.NODE_ENV);

// Create Express app
const app = express();

// Middleware configuration with proper application
app.use(helmet());
app.use(morgan("dev"));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URL || "mongodb://localhost:27017/testdb",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("Database connected successfully.");
    // Ensure the connection is fully established
    await mongoose.connection.db.admin().listDatabases();
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

// Detailed route handlers
const userControllers = {
  getUser: (req, res) => res.json({ message: "Get user" }),
  getAllUsers: (req, res) => res.json({ message: "Get all users" }),
  updateUser: (req, res) => res.json({ message: "Update user" }),
  deleteUser: (req, res) => res.json({ message: "Delete user" }),
};

// Explicit route configuration with full path
app.get("/api/user", userControllers.getUser);
app.get("/api/users", userControllers.getAllUsers);
app.put("/api/update/user", userControllers.updateUser);
app.delete("/api/delete/user", userControllers.deleteUser);

// Explicit error route
app.get("/trigger-error", (req, res, next) => {
  const error = new Error("Test Error");
  next(error);
});

// 404 handler with explicit message
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

// Comprehensive error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Server startup
const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, async () => {
  console.log(`Server is running on port: ${PORT}`);
  await connectDB();
});

export default app;
