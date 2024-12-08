const User = require("../models/user"); // Adjust the path to the actual model
const mongoose = require("mongoose");

beforeAll(async () => {
  await mongoose.connect("mongodb://localhost:27017/testDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("User Model", () => {
  test("should validate user with all correct fields", () => {
    const validUser = new User({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phoneNumber: "0771234567",
    });
    const validationError = validUser.validateSync();
    expect(validationError).toBeUndefined();
  });

  test("should fail validation for invalid email", () => {
    const invalidUser = new User({
      email: "invalid-email",
    });
    const validationError = invalidUser.validateSync();
    expect(validationError).toBeDefined();
  });

  test("should fail validation for invalid phone number", () => {
    const invalidUser = new User({
      phoneNumber: "123",
    });
    const validationError = invalidUser.validateSync();
    expect(validationError).toBeDefined();
  });
});
