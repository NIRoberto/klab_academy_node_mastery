import express from "express";
import type { Response, Request } from "express";
import { User, IUser } from "../models/user.model";

async function getAllUsers(req: Request, res: Response) {
  try {
    const users = await User.find().select('-password');
    return res.status(200).json({
      success: true,
      users: users,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

async function getUserById(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ 
      success: true,
      user: user 
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

async function createUser(req: Request, res: Response) {
  try {
    const { firstName, lastName, email, password } = req.body;
    
    const user = await User.create({
      firstName,
      lastName,
      email,
      password
    });

    const userResponse = user.toObject();
    const { password: _, ...userWithoutPassword } = userResponse;

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: userWithoutPassword,
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Email already exists'
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

async function updateUserById(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const updates = req.body;
    
    const user = await User.findByIdAndUpdate(
      id, 
      updates, 
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: user
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

async function deleteUserById(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

export { getAllUsers, getUserById, createUser, updateUserById, deleteUserById };
