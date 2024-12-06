import User from "../model/userModel.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Multer upload configuration
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png|gif/;
    const extname = allowedFileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedFileTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Error: Images only (jpeg, jpg, png, gif)!"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
});

// Middleware to handle file upload
const uploadMiddleware = (req, res, next) => {
  upload.single("profilePicture")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      return res.status(400).json({ message: err.message });
    } else if (err) {
      // An unknown error occurred when uploading.
      return res.status(500).json({ message: err.message });
    }
    next();
  });
};

// Create a new user
export const create = [
  uploadMiddleware,
  async (req, res) => {
    try {
      const { firstName, lastName, email, phoneNumber, gender } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !phoneNumber || !gender) {
        return res.status(400).json({ message: "All fields are required." });
      }

      // Check if user already exists
      const userExist = await User.findOne({ email });
      if (userExist) {
        return res.status(400).json({ message: "User already exists." });
      }

      // Prepare profile picture path
      const profilePicture = req.file ? `/uploads/${req.file.filename}` : null;

      // Create a new user
      const newUser = new User({
        firstName,
        lastName,
        email,
        phoneNumber,
        gender,
        profilePicture,
      });

      // Save user data to the database
      const savedData = await newUser.save();
      res
        .status(201)
        .json({ message: "User created successfully.", data: savedData });
    } catch (error) {
      res.status(500).json({ errorMessage: error.message });
    }
  },
];

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const userData = await User.find();
    if (!userData || userData.length === 0) {
      return res.status(404).json({ message: "No users found." });
    }
    res.status(200).json(userData);
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const userExist = await User.findById(id);
    if (!userExist) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json(userExist);
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

// Update a user
export const update = [
  uploadMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Validate ID
      if (!id) {
        return res.status(400).json({ message: "User ID is required." });
      }

      const userExist = await User.findById(id);
      if (!userExist) {
        return res.status(404).json({ message: "User not found." });
      }

      // Prepare update data
      const updateData = { ...req.body };

      // Handle profile picture update
      if (req.file) {
        // Delete old profile picture if exists
        if (userExist.profilePicture) {
          const oldFilePath = path.join(
            process.cwd(),
            "public",
            userExist.profilePicture
          );
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }

        // Set new profile picture path
        updateData.profilePicture = `/uploads/${req.file.filename}`;
      }

      // Update user data
      const updatedData = await User.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      res
        .status(200)
        .json({ message: "User updated successfully.", data: updatedData });
    } catch (error) {
      res.status(500).json({ errorMessage: error.message });
    }
  },
];

// Delete a user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const userExist = await User.findById(id);
    if (!userExist) {
      return res.status(404).json({ message: "User not found." });
    }

    // Delete profile picture if exists
    if (userExist.profilePicture) {
      const filePath = path.join(
        process.cwd(),
        "public",
        userExist.profilePicture
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete user from database
    await User.findByIdAndDelete(id);
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

export default {
  create,
  getAllUsers,
  getUserById,
  update,
  deleteUser,
};
