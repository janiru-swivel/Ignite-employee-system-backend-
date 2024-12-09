import request from "supertest";
import mongoose from "mongoose";
import express from "express";
import bodyParser from "body-parser";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import route from "../routes/userRoute.js";
import User from "../model/userModel.js";

dotenv.config();

// Create a test Express app
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "public", "uploads"))
);
app.use("/api", route);

// Test data
const testUser = {
  firstName: "John",
  lastName: "Doe",
  email: "johndoe@example.com",
  phoneNumber: "+1-555-123-4567",
  gender: "M",
};

const updatedUser = {
  firstName: "Jane",
  lastName: "Smith",
  email: "janesmith@example.com",
  phoneNumber: "+1-555-987-6543",
  gender: "F",
};

describe("User Management API", () => {
  let createdUserId;
  let testProfilePicturePath;

  // Connect to a test database before running tests
  beforeAll(async () => {
    await mongoose.connect(
      process.env.MONGO_TEST_URL || "mongodb://localhost:27017/testdb",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
  });

  // Clear the database before each test
  beforeEach(async () => {
    await User.deleteMany({});
  });

  // Create a test profile picture
  beforeEach(() => {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Create a dummy image file
    testProfilePicturePath = path.join(uploadDir, "test-profile.jpg");
    fs.writeFileSync(testProfilePicturePath, Buffer.from("test image data"));
  });

  // Remove test profile picture after each test
  afterEach(() => {
    if (fs.existsSync(testProfilePicturePath)) {
      fs.unlinkSync(testProfilePicturePath);
    }
  });

  // Disconnect from database after tests
  afterAll(async () => {
    await mongoose.connection.close();
  });

  // Test user creation
  describe("POST /api/user", () => {
    it("should create a new user successfully", async () => {
      const response = await request(app)
        .post("/api/user")
        .field("firstName", testUser.firstName)
        .field("lastName", testUser.lastName)
        .field("email", testUser.email)
        .field("phoneNumber", testUser.phoneNumber)
        .field("gender", testUser.gender)
        .attach("profilePicture", testProfilePicturePath);

      expect(response.statusCode).toBe(201);
      expect(response.body.message).toBe("User created successfully.");
      expect(response.body.data).toMatchObject({
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        email: testUser.email,
        phoneNumber: testUser.phoneNumber,
        gender: testUser.gender,
      });

      createdUserId = response.body.data._id;
    });

    it("should return 400 if required fields are missing", async () => {
      const response = await request(app).post("/api/user").send({
        firstName: testUser.firstName,
        lastName: testUser.lastName,
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("All fields are required.");
    });

    it("should return 400 if user already exists", async () => {
      // First create a user
      await request(app)
        .post("/api/user")
        .field("firstName", testUser.firstName)
        .field("lastName", testUser.lastName)
        .field("email", testUser.email)
        .field("phoneNumber", testUser.phoneNumber)
        .field("gender", testUser.gender)
        .attach("profilePicture", testProfilePicturePath);

      // Try to create the same user again
      const response = await request(app)
        .post("/api/user")
        .field("firstName", testUser.firstName)
        .field("lastName", testUser.lastName)
        .field("email", testUser.email)
        .field("phoneNumber", testUser.phoneNumber)
        .field("gender", testUser.gender)
        .attach("profilePicture", testProfilePicturePath);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("User already exists.");
    });
  });

  // Test get all users
  describe("GET /api/users", () => {
    it("should get all users", async () => {
      // Create a user first
      await request(app)
        .post("/api/user")
        .field("firstName", testUser.firstName)
        .field("lastName", testUser.lastName)
        .field("email", testUser.email)
        .field("phoneNumber", testUser.phoneNumber)
        .field("gender", testUser.gender)
        .attach("profilePicture", testProfilePicturePath);

      const response = await request(app).get("/api/users");

      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it("should return 404 if no users exist", async () => {
      const response = await request(app).get("/api/users");

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe("No users found.");
    });
  });

  // Test get user by ID
  describe("GET /api/user/:id", () => {
    it("should get a user by valid ID", async () => {
      // Create a user first
      const createResponse = await request(app)
        .post("/api/user")
        .field("firstName", testUser.firstName)
        .field("lastName", testUser.lastName)
        .field("email", testUser.email)
        .field("phoneNumber", testUser.phoneNumber)
        .field("gender", testUser.gender)
        .attach("profilePicture", testProfilePicturePath);

      const userId = createResponse.body.data._id;

      const response = await request(app).get(`/api/user/${userId}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toMatchObject({
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        email: testUser.email,
      });
    });

    it("should return 404 for non-existent user ID", async () => {
      const fakeId = mongoose.Types.ObjectId();

      const response = await request(app).get(`/api/user/${fakeId}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe("User not found.");
    });
  });

  // Test user update
  describe("PUT /api/update/user/:id", () => {
    it("should update user successfully", async () => {
      // Create a user first
      const createResponse = await request(app)
        .post("/api/user")
        .field("firstName", testUser.firstName)
        .field("lastName", testUser.lastName)
        .field("email", testUser.email)
        .field("phoneNumber", testUser.phoneNumber)
        .field("gender", testUser.gender)
        .attach("profilePicture", testProfilePicturePath);

      const userId = createResponse.body.data._id;

      const response = await request(app)
        .put(`/api/update/user/${userId}`)
        .field("firstName", updatedUser.firstName)
        .field("lastName", updatedUser.lastName)
        .field("email", updatedUser.email)
        .field("phoneNumber", updatedUser.phoneNumber)
        .field("gender", updatedUser.gender);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("User updated successfully.");
      expect(response.body.data).toMatchObject({
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
      });
    });

    it("should return 404 when trying to update non-existent user", async () => {
      const fakeId = mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/update/user/${fakeId}`)
        .send(updatedUser);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe("User not found.");
    });
  });

  // Test user deletion
  describe("DELETE /api/delete/user/:id", () => {
    it("should delete user successfully", async () => {
      // Create a user first
      const createResponse = await request(app)
        .post("/api/user")
        .field("firstName", testUser.firstName)
        .field("lastName", testUser.lastName)
        .field("email", testUser.email)
        .field("phoneNumber", testUser.phoneNumber)
        .field("gender", testUser.gender)
        .attach("profilePicture", testProfilePicturePath);

      const userId = createResponse.body.data._id;

      const response = await request(app).delete(`/api/delete/user/${userId}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("User deleted successfully.");

      // Verify user is actually deleted
      const deletedUser = await User.findById(userId);
      expect(deletedUser).toBeNull();
    });

    it("should return 404 when trying to delete non-existent user", async () => {
      const fakeId = mongoose.Types.ObjectId();

      const response = await request(app).delete(`/api/delete/user/${fakeId}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe("User not found.");
    });
  });

  // Validation tests
  describe("Input Validation", () => {
    it("should reject invalid email format", async () => {
      const response = await request(app)
        .post("/api/user")
        .field("firstName", testUser.firstName)
        .field("lastName", testUser.lastName)
        .field("email", "invalid-email")
        .field("phoneNumber", testUser.phoneNumber)
        .field("gender", testUser.gender);

      expect(response.statusCode).toBe(400);
    });

    it("should reject invalid phone number", async () => {
      const response = await request(app)
        .post("/api/user")
        .field("firstName", testUser.firstName)
        .field("lastName", testUser.lastName)
        .field("email", testUser.email)
        .field("phoneNumber", "123")
        .field("gender", testUser.gender);

      expect(response.statusCode).toBe(400);
    });

    it("should reject invalid gender", async () => {
      const response = await request(app)
        .post("/api/user")
        .field("firstName", testUser.firstName)
        .field("lastName", testUser.lastName)
        .field("email", testUser.email)
        .field("phoneNumber", testUser.phoneNumber)
        .field("gender", "X");

      expect(response.statusCode).toBe(400);
    });
  });
});
