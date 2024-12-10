import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import User from "../../model/userModel";
import userRoutes from "../../routes/userRoute";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("User Controller Integration Tests", () => {
  let app;
  let mongoServer;
  let validUserId;
  const testImagePath = path.join(__dirname, "__mocks__", "test-image.png");

  // Create a test image file
  beforeAll(async () => {
    // Ensure test image directory exists
    const mockDir = path.join(__dirname, "__mocks__");
    if (!fs.existsSync(mockDir)) {
      fs.mkdirSync(mockDir, { recursive: true });
    }

    // Create test image if it doesn't exist
    if (!fs.existsSync(testImagePath)) {
      fs.writeFileSync(testImagePath, "test image content");
    }

    // Setup MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Setup Express App
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use("/uploads", express.static("public/uploads"));
    app.use(userRoutes);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();

    // Clean up test image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  // Helper function to create a valid user with unique email
  const createValidUser = async (emailSuffix = "") => {
    const userData = {
      firstName: "John",
      lastName: "Doe",
      email: `john.doe${emailSuffix}@example.com`,
      phoneNumber: `+1 (555) 123-${Math.floor(Math.random() * 9000) + 1000}`,
      gender: "M",
    };
    const user = new User(userData);
    const savedUser = await user.save();
    return savedUser;
  };

  describe("POST /user - Create User", () => {
    it("should create a new user successfully", async () => {
      const response = await request(app)
        .post("/user")
        .field("firstName", "John")
        .field("lastName", "Doe")
        .field("email", "john.doe@example.com")
        .field("phoneNumber", "+1 (555) 123-4567")
        .field("gender", "M")
        .attach("profilePicture", testImagePath);

      expect(response.statusCode).toBe(201);
      expect(response.body.data).toHaveProperty("_id");
      expect(response.body.data.email).toBe("john.doe@example.com");
      expect(response.body.data.profilePicture).toMatch(/^\/uploads\/.+\.png$/);
    });

    it("should fail to create a user with duplicate email", async () => {
      // First, create a user
      await createValidUser();

      // Try to create another user with same email
      const response = await request(app)
        .post("/user")
        .field("firstName", "Jane")
        .field("lastName", "Doe")
        .field("email", "john.doe@example.com")
        .field("phoneNumber", "+1 (555) 987-6543")
        .field("gender", "F");

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("User already exists.");
    });
  });

  describe("GET /users - Get All Users", () => {
    it("should get all users", async () => {
      // Create a few users with unique emails
      await createValidUser("1");
      await createValidUser("2");

      const response = await request(app).get("/users");

      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBe(2);
    });

    it("should return 404 when no users exist", async () => {
      const response = await request(app).get("/users");

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe("No users found.");
    });
  });

  describe("GET /user/:id - Get User by ID", () => {
    it("should get a user by ID", async () => {
      const savedUser = await createValidUser();

      const response = await request(app).get(`/user/${savedUser._id}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.email).toBe("john.doe@example.com");
    });

    it("should return 404 for non-existent user", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app).get(`/user/${fakeId}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe("User not found.");
    });
  });

  describe("PUT /update/user/:id - Update User", () => {
    it("should update a user successfully", async () => {
      const savedUser = await createValidUser();

      const response = await request(app)
        .put(`/update/user/${savedUser._id}`)
        .field("firstName", "Jane")
        .attach("profilePicture", testImagePath);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.firstName).toBe("Jane");
      expect(response.body.data.profilePicture).toMatch(/^\/uploads\/.+\.png$/);
    });

    it("should return 404 when updating non-existent user", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/update/user/${fakeId}`)
        .field("firstName", "Jane");

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe("User not found.");
    });
  });

  describe("DELETE /delete/user/:id - Delete User", () => {
    it("should delete a user successfully", async () => {
      const savedUser = await createValidUser();

      const response = await request(app).delete(
        `/delete/user/${savedUser._id}`
      );

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("User deleted successfully.");

      // Verify user is actually deleted
      const deletedUser = await User.findById(savedUser._id);
      expect(deletedUser).toBeNull();
    });

    it("should return 404 when deleting non-existent user", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app).delete(`/delete/user/${fakeId}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe("User not found.");
    });
  });
});
