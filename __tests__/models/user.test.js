import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../../model/userModel";

describe("User Model Test", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe("User Model Validation", () => {
    const validUserData = {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phoneNumber: "+1 (555) 123-4567",
      gender: "M",
    };

    it("should create & save user successfully", async () => {
      const validUser = new User(validUserData);
      const savedUser = await validUser.save();

      // Assert
      expect(savedUser._id).toBeDefined();
      expect(savedUser.firstName).toBe(validUserData.firstName);
      expect(savedUser.email).toBe(validUserData.email);
    });

    it("should fail to save user without required fields", async () => {
      const userWithoutRequiredField = new User({
        firstName: "John",
      });

      let err;
      try {
        await userWithoutRequiredField.save();
      } catch (error) {
        err = error;
      }
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    });

    describe("Validation Checks", () => {
      // First Name Validations
      it("should fail with first name less than 2 characters", async () => {
        const user = new User({
          ...validUserData,
          firstName: "A",
        });

        await expect(user.save()).rejects.toThrow(
          "First name must be at least 2 characters long"
        );
      });

      it("should fail with first name containing non-alphabetic characters", async () => {
        const user = new User({
          ...validUserData,
          firstName: "John123",
        });

        await expect(user.save()).rejects.toThrow(
          "First name must only contain alphabets"
        );
      });

      // Email Validations
      it("should fail with invalid email format", async () => {
        const user = new User({
          ...validUserData,
          email: "invalidemail",
        });

        await expect(user.save()).rejects.toThrow(
          "Please enter a valid email address"
        );
      });

      // Phone Number Validations
      it("should fail with invalid phone number format", async () => {
        const user = new User({
          ...validUserData,
          phoneNumber: "123",
        });

        await expect(user.save()).rejects.toThrow(
          "Please enter a valid phone number"
        );
      });

      // Gender Validations
      it("should fail with invalid gender", async () => {
        const user = new User({
          ...validUserData,
          gender: "X",
        });

        await expect(user.save()).rejects.toThrow(
          "Gender must be either 'M' or 'F'"
        );
      });
    });

    // Unique Email Test
    it("should prevent duplicate email addresses", async () => {
      const user1 = new User(validUserData);
      await user1.save();

      const user2 = new User({
        ...validUserData,
        firstName: "Jane",
      });

      await expect(user2.save()).rejects.toThrow();
    });
  });
});
