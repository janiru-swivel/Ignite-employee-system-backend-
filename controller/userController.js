import User from "../model/userModel.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { logger } from '../config/logger.js';

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Multer upload configuration
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png|gif/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
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
      logger.error('Multer upload error:', { error: err.message });
      return res.status(400).json({ message: err.message });
    } else if (err) {
      logger.error('Unknown upload error:', { error: err.message });
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
      
      logger.info('Attempting to create new user:', { email });

      if (!firstName || !lastName || !email || !phoneNumber || !gender) {
        logger.warn('Missing required fields in user creation');
        return res.status(400).json({ message: "All fields are required." });
      }

      const userExist = await User.findOne({ email });
      if (userExist) {
        logger.warn('Attempted to create duplicate user:', { email });
        return res.status(400).json({ message: "User already exists." });
      }

      const profilePicture = req.file ? `/uploads/${req.file.filename}` : null;

      const newUser = new User({
        firstName,
        lastName,
        email,
        phoneNumber,
        gender,
        profilePicture,
      });

      const savedData = await newUser.save();
      logger.info('User created successfully:', { userId: savedData._id });
      
      res.status(201).json({ 
        message: "User created successfully.", 
        data: savedData 
      });
    } catch (error) {
      logger.error('Error creating user:', { 
        error: error.message, 
        stack: error.stack 
      });
      res.status(500).json({ errorMessage: error.message });
    }
  },
];

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    logger.info('Fetching all users');
    const userData = await User.find();
    
    if (!userData || userData.length === 0) {
      logger.info('No users found in database');
      return res.status(404).json({ message: "No users found." });
    }
    
    logger.info(`Retrieved ${userData.length} users`);
    res.status(200).json(userData);
  } catch (error) {
    logger.error('Error fetching users:', { 
      error: error.message, 
      stack: error.stack 
    });
    res.status(500).json({ errorMessage: error.message });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('Fetching user by ID:', { userId: id });

    if (!id) {
      logger.warn('User ID not provided');
      return res.status(400).json({ message: "User ID is required." });
    }

    const userExist = await User.findById(id);
    if (!userExist) {
      logger.warn('User not found:', { userId: id });
      return res.status(404).json({ message: "User not found." });
    }

    logger.info('User retrieved successfully:', { userId: id });
    res.status(200).json(userExist);
  } catch (error) {
    logger.error('Error fetching user by ID:', { 
      error: error.message, 
      stack: error.stack,
      userId: req.params.id 
    });
    res.status(500).json({ errorMessage: error.message });
  }
};

// Update a user
export const update = [
  uploadMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      logger.info('Attempting to update user:', { userId: id });

      if (!id) {
        logger.warn('User ID not provided for update');
        return res.status(400).json({ message: "User ID is required." });
      }

      const userExist = await User.findById(id);
      if (!userExist) {
        logger.warn('User not found for update:', { userId: id });
        return res.status(404).json({ message: "User not found." });
      }

      const updateData = { ...req.body };

      if (req.file) {
        if (userExist.profilePicture) {
          const oldFilePath = path.join(process.cwd(), "public", userExist.profilePicture);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            logger.info('Old profile picture deleted:', { userId: id });
          }
        }
        updateData.profilePicture = `/uploads/${req.file.filename}`;
      }

      const updatedData = await User.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      logger.info('User updated successfully:', { userId: id });
      res.status(200).json({ 
        message: "User updated successfully.", 
        data: updatedData 
      });
    } catch (error) {
      logger.error('Error updating user:', { 
        error: error.message, 
        stack: error.stack,
        userId: req.params.id 
      });
      res.status(500).json({ errorMessage: error.message });
    }
  },
];

// Delete a user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('Attempting to delete user:', { userId: id });

    if (!id) {
      logger.warn('User ID not provided for deletion');
      return res.status(400).json({ message: "User ID is required." });
    }

    const userExist = await User.findById(id);
    if (!userExist) {
      logger.warn('User not found for deletion:', { userId: id });
      return res.status(404).json({ message: "User not found." });
    }

    if (userExist.profilePicture) {
      const filePath = path.join(process.cwd(), "public", userExist.profilePicture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info('Profile picture deleted:', { userId: id });
      }
    }

    await User.findByIdAndDelete(id);
    logger.info('User deleted successfully:', { userId: id });
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    logger.error('Error deleting user:', { 
      error: error.message, 
      stack: error.stack,
      userId: req.params.id 
    });
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