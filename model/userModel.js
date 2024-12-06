import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      minlength: [2, "First name must be at least 2 characters long"],
      maxlength: [50, "First name cannot exceed 50 characters"],
      match: [/^[A-Za-z\s]+$/, "First name must only contain alphabets"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      minlength: [2, "Last name must be at least 2 characters long"],
      maxlength: [50, "Last name cannot exceed 50 characters"],
      match: [/^[A-Za-z\s]+$/, "Last name must only contain alphabets"],
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      match: [
        /^(?:\+\d{1,3})?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/,
        "Please enter a valid phone number",
      ],
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: {
        values: ["M", "F"],
        message: "Gender must be either 'M' or 'F'",
      },
    },
    profilePicture: {
      type: String, // URL or path to the uploaded image
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);
