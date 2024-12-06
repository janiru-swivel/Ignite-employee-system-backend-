import User from "../model/userModel.js";

// Create a new user
export const create = async (req, res) => {
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

    // Create a new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      phoneNumber,
      gender,
    });

    // Save user data to the database
    const savedData = await newUser.save();
    res
      .status(201)
      .json({ message: "User created successfully.", data: savedData });
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

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
export const update = async (req, res) => {
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

    // Update user data
    const updatedData = await User.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true, // Ensure the updated data is validated
    });

    res
      .status(200)
      .json({ message: "User updated successfully.", data: updatedData });
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};

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

    await User.findByIdAndDelete(id);
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
};
