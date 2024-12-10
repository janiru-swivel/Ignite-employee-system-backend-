import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import express from "express";
import bodyParser from "body-parser";
import userRoute from "../../routes/userRoute";
import User from "../../model/userModel";

const mockUser = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phoneNumber: "+12345678901",
  gender: "M",
  profilePicture: "/uploads/test-profile.jpg",
};

describe("User Routes", () => {
  let app;
  let mongoServer;

  // Setup before all tests
  beforeAll(async () => {
    // Create an in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Create an Express app for testing
    app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use("/api", userRoute);

    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
  });

  // Cleanup after all tests
  afterAll(async () => {
    // Disconnect from mongoose and stop the MongoDB server
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // Clear database before each test
  beforeEach(async () => {
    await User.deleteMany({});
  });

  // Test user creation
  describe("POST /api/user", () => {
    it("should create a new user", async () => {
      const res = await request(app).post("/api/user").send(mockUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty("data");
      expect(res.body.data).toHaveProperty("_id");
      expect(res.body.data.firstName).toEqual(mockUser.firstName);
      expect(res.body).toHaveProperty("message", "User created successfully.");
    });

    it("should return 400 for invalid user data", async () => {
      const invalidUser = { ...mockUser, email: "" };

      const res = await request(app).post("/api/user").send(invalidUser);

      expect(res.statusCode).toEqual(400);
    });
  });

  // Test get all users
  describe("GET /api/users", () => {
    it("should return all users", async () => {
      // First, create a user
      await User.create(mockUser);

      const res = await request(app).get("/api/users");

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  // Test get user by ID
  describe("GET /api/user/:id", () => {
    it("should return a specific user", async () => {
      // Create a user first
      const user = await User.create(mockUser);

      const res = await request(app).get(`/api/user/${user._id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.firstName).toEqual(mockUser.firstName);
    });

    it("should return 404 for non-existent user", async () => {
      // Correctly create a fake ObjectId
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app).get(`/api/user/${fakeId}`);

      expect(res.statusCode).toEqual(404);
    });
  });

  // Test user update
  describe("PUT /api/update/user/:id", () => {
    it("should update an existing user", async () => {
      // Create a user first
      const user = await User.create(mockUser);

      const updatedUserData = {
        ...mockUser,
        firstName: "Jane",
      };

      const res = await request(app)
        .put(`/api/update/user/${user._id}`)
        .send(updatedUserData);

      expect(res.statusCode).toEqual(200);

      // Verify the update
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.firstName).toEqual("Jane");
    });

    it("should return 404 for updating non-existent user", async () => {
      // Correctly create a fake ObjectId
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`/api/update/user/${fakeId}`)
        .send(mockUser);

      expect(res.statusCode).toEqual(404);
    });
  });

  // Test user deletion
  describe("DELETE /api/delete/user/:id", () => {
    it("should delete an existing user", async () => {
      // Create a user first
      const user = await User.create(mockUser);

      const res = await request(app).delete(`/api/delete/user/${user._id}`);

      expect(res.statusCode).toEqual(200);

      // Verify deletion
      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });

    it("should return 404 for deleting non-existent user", async () => {
      // Correctly create a fake ObjectId
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app).delete(`/api/delete/user/${fakeId}`);

      expect(res.statusCode).toEqual(404);
    });
  });
});
