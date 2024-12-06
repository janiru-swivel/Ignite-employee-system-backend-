import express from "express";
import {
  create,
  deleteUser,
  getAllUsers,
  getUserById,
  update,
} from "../controller/userController.js";

const route = express.Router();

// Define routes for user operations
route.post("/user", create); // Create user
route.get("/users", getAllUsers); // Get all users
route.get("/user/:id", getUserById); // Get user by ID
route.put("/update/user/:id", update); // Update user
route.delete("/delete/user/:id", deleteUser); // Delete user

export default route;
