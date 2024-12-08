const request = require("supertest");
const mongoose = require("mongoose");
const path = require("path");
const app = require("../index");

describe("User Controller API", () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({
      firstName: "Test",
      lastName: "User",
      email: "test.user@example.com",
      phoneNumber: "+1-555-987-6543",
      gender: "F",
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  test("create user successfully", async () => {
    const response = await request(app).post("/api/user").send({
      firstName: "New",
      lastName: "User",
      email: "new.user@example.com",
      phoneNumber: "+1-555-111-2222",
      gender: "M",
    });
    expect(response.statusCode).toBe(201);
    expect(response.body.data.email).toBe("new.user@example.com");
  });

  test("cannot create duplicate user", async () => {
    const response = await request(app).post("/api/user").send({
      firstName: "Test",
      lastName: "User",
      email: "test.user@example.com",
      phoneNumber: "+1-555-987-6543",
      gender: "F",
    });
    expect(response.statusCode).toBe(400);
  });

  test("update user profile picture", async () => {
    const response = await request(app)
      .put(`/api/update/user/${testUser._id}`)
      .attach("profilePicture", path.join(__dirname, "test-image.jpg"));

    expect(response.statusCode).toBe(200);
    expect(response.body.data.profilePicture).toContain("/uploads/");
  });

  test("delete user", async () => {
    const response = await request(app).delete(
      `/api/delete/user/${testUser._id}`
    );

    expect(response.statusCode).toBe(200);
  });
});

describe("File Upload Middleware", () => {
  test("should reject non-image files", async () => {
    const response = await request(app)
      .post("/api/user")
      .attach("profilePicture", path.join(__dirname, "test-document.pdf"));

    expect(response.statusCode).toBe(400);
  });

  test("should limit file size to 5MB", async () => {
    const largefile = Buffer.alloc(6 * 1024 * 1024); // 6MB file
    const response = await request(app)
      .post("/api/user")
      .attach("profilePicture", largefile, "large-image.jpg");

    expect(response.statusCode).toBe(400);
  });
});

describe("Error Handling", () => {
  test("get non-existent user returns 404", async () => {
    const fakeId = mongoose.Types.ObjectId();
    const response = await request(app).get(`/api/user/${fakeId}`);

    expect(response.statusCode).toBe(404);
  });

  test("update with invalid data fails", async () => {
    const response = await request(app)
      .put("/api/update/user/invalidid")
      .send({ email: "invalidemail" });

    expect(response.statusCode).toBe(400);
  });
});
