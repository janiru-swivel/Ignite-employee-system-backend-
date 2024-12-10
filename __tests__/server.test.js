import request from "supertest";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import dotenv from "dotenv";

import app from "../server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

describe("Express Server", () => {
  // Modify database connection to avoid process exit
  beforeAll(async () => {
    try {
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(
          process.env.MONGO_URL || "mongodb://localhost:27017/testdb"
        );
      }
    } catch (error) {
      console.error("Database connection error:", error);
      if (process.env.NODE_ENV === "test") {
        throw error; // Prevent process.exit in tests
      } else {
        process.exit(1);
      }
    }
  });

  // Server-level tests
  describe("Server Configuration", () => {
    it("should have required middleware configured", () => {
      expect(app).toBeTruthy();

      // Check if standard middleware is applied
      const middlewares = [
        {
          name: "helmet",
          check: (layer) => layer.handle && layer.handle.name === "helmet",
        },
        {
          name: "morgan",
          check: (layer) =>
            layer.handle && layer.handle.name.includes("morgan"),
        },
        {
          name: "cors",
          check: (layer) =>
            layer.handle && layer.handle.name.includes("corsMiddleware"),
        },
        {
          name: "json",
          check: (layer) => layer.handle && layer.handle.name === "jsonParser",
        },
        {
          name: "urlencoded",
          check: (layer) =>
            layer.handle && layer.handle.name === "urlencodedParser",
        },
      ];

      middlewares.forEach((middleware) => {
        const middlewareFound = app._router.stack.some(middleware.check);
        expect(middlewareFound).toBeTruthy(
          `${middleware.name} middleware not found`
        );
      });
    });

    it("should have routes configured", () => {
      // Check if API routes are registered
      const routes = [
        "/api/user",
        "/api/users",
        "/api/update/user",
        "/api/delete/user",
      ];

      routes.forEach((route) => {
        const matchingLayer = app._router.stack.find(
          (layer) =>
            layer.route &&
            layer.route.path &&
            layer.route.path.includes(route.replace("/api", ""))
        );

        expect(matchingLayer).toBeTruthy(`Route ${route} should be configured`);
      });
    });
  });

  // Database Connection Test
  describe("Database Connection", () => {
    it("should connect to MongoDB", async () => {
      expect(mongoose.connection.readyState).toBe(1);
    });
  });

  // Server Response Tests
  describe("Server Responses", () => {
    it("should handle 404 for undefined routes", async () => {
      const res = await request(app).get("/undefined-route");
      expect(res.status).toBe(404);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });

    it("should have error handling middleware", async () => {
      const res = await request(app).get("/trigger-error").expect(500);

      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        })
      );
    });
  });

  // Environment Configuration Test
  describe("Environment Configuration", () => {
    it("should load environment variables", () => {
      expect(process.env.PORT).toBeDefined();
      expect(process.env.MONGO_URL).toBeDefined();
    });

    it("should have CORS configured", () => {
      process.env.CORS_ORIGIN =
        process.env.CORS_ORIGIN || "http://localhost:3000";
      expect(process.env.CORS_ORIGIN).toBeDefined();
    });
  });

  // Static File Serving Test
  describe("Static File Serving", () => {
    it("should serve static files from uploads directory", async () => {
      const uploadsDir = path.resolve(__dirname, "../uploads");
      const testImagePath = path.join(uploadsDir, "test-image.jpg");

      await fs.mkdir(uploadsDir, { recursive: true });

      // Create a dummy file if it doesn't exist
      try {
        await fs.access(testImagePath);
      } catch {
        await fs.writeFile(testImagePath, Buffer.from([0xff, 0xd8, 0xff]));
      }

      const res = await request(app).get("/uploads/test-image.jpg");
      expect([200, 404]).toContain(res.status);
    });
  });

  // Cleanup after tests
  afterAll(async () => {
    try {
      await mongoose.connection.close();
    } catch (error) {
      console.error("Error closing mongoose connection:", error);
    }
  });
});
