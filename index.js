import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
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
console.log("ENV ", process.env.CORS_ORIGIN);

// Middleware
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "common"));
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "public", "uploads"))
);

// Routes
app.use("/api", route);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
