import express from "express";
import {
  createUser,
  deleteUserById,
  getAllUsers,
  getUserById,
} from "../controllers/users.controller";

const userRouter = express.Router();

//  endpoint

// Get all users, get single user by id , update user, and delete

userRouter.get("/", getAllUsers);

userRouter.get("/:id", getUserById);

// create
userRouter.post("/", createUser);

userRouter.delete("/:id", deleteUserById);

export default userRouter;
