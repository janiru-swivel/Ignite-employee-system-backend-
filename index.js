import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import route from "./routes/userRoute.js";

const app = express();
dotenv.config(); // Load environment variables

const PORT = process.env.PORT || 7000;
const MONGO_URL = process.env.MONGO_URL;

// Debugging log: check if the MONGO_URL is being loaded correctly
if (!MONGO_URL) {
  console.error("Error: MONGO_URL is not defined. Check your .env file.");
  process.exit(1); // Exit the process if MONGO_URL is not defined
}

console.log("MONGO_URL:", MONGO_URL); // Log the MONGO_URL for debugging

// MongoDB connection
mongoose
  .connect(MONGO_URL, {
    useNewUrlParser: true, // Mongoose options for compatibility
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database connected successfully.");
    app.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exit(1); // Exit the process if MongoDB connection fails
  });

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Serve static files from the 'public' directory
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "public", "uploads"))
);

// API routes
app.use("/api", route); // Use the route file for user-related operations
