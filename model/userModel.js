import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      minlength: [6, "First name must be at least 6 characters long"],
      maxlength: [10, "First name cannot exceed 10 characters"],
      match: [/^[A-Za-z]+$/, "First name must only contain alphabets"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      minlength: [6, "Last name must be at least 6 characters long"],
      maxlength: [10, "Last name cannot exceed 10 characters"],
      match: [/^[A-Za-z]+$/, "Last name must only contain alphabets"],
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
        /^(?:\+94|0)?[1-9][0-9]{8}$/,
        "Please enter a valid Sri Lankan phone number",
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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Employee", employeeSchema);
