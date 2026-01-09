import express from "express";
import type { Response, Request } from "express";
import { User } from "../models/user.model";

const users: User[] = [
  {
    id: 1,
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    password: "XXXXXXXXXXX",
  },
  {
    id: 2,
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    password: "XXXXXXXXXXXXXX",
  },
  {
    id: 3,
    firstName: "Alice",
    lastName: "Johnson",
    email: "alice.johnson@example.com",
    password: "XXXXXXXX",
  },
  {
    id: 4,
    firstName: "Bob",
    lastName: "Williams",
    email: "bob.williams@example.com",
    password: "XXXXXXX",
  },
  {
    id: 5,
    firstName: "Eva",
    lastName: "Brown",
    email: "eva.brown@example.com",
    password: "XXXXXXXXXXX",
  },
];

function getAllUsers(req: Request, res: Response) {
  return res.status(200).json({
    users: users,
  });
}

function getUserById(req: Request, res: Response) {
  const id = req.params.id;

  const user = users.find((user) => user.id === parseInt(id || ""));

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.status(200).json({ user: user });
}

function createUser(req: Request, res: Response) {
  users.push({
    id: users.length + 1,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
  });

  return res.status(201).json({
    message: "User created successfully",
    user: users[users.length - 1],
  });
}

function updateUserById(req: Request, res: Response) {
  return res.send("Update User");
}

function deleteUserById(req: Request, res: Response) {
  return res.send("Delete User");
}

export { getAllUsers, getUserById, createUser, updateUserById, deleteUserById };
