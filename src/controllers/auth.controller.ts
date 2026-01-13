import bcrypt from "bcryptjs";

import express, { Request, Response } from "express";
import { User } from "../models/user.model";
import { signToken } from "../utils/jwt.helper";
import { AuthRequest } from "../middlewares/authenticate";

const register = async (req: Request, res: Response) => {
  try {
    //  validation user information  (  firstName, lastName , email, password )

    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "All fields are required",
      });
    }
    //  we can check if the user  exist or not
    const user = await User.findOne({
      email,
    });

    if (user) {
      return res.status(409).json({
        status: "fail",
        message: "User already exist",
      });
    }
    //  register a user after that ,  we ill not store password   hash the password

    const hashPassword = await bcrypt.hash(password, 10);

    // generate token for the user

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashPassword,
    });

    const token = await signToken({
      id: newUser.id,
      email: newUser.email,
    });

    return res.status(201).json({
      status: "success",
      message: "User Created",
      user: newUser,
      token,
    });
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      status: "success",
      message: "User register failed ",
      error,
    });
  }
};

const login = async (
  req: Request,
  res: Response,
  next: express.NextFunction
) => {
  try {
    // validate user information

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "All fields are required",
      });
    }

    //   credentials are valid or not

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid credentials",
      });
    }

    // verify the password

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid credentials",
      });
    }

    // give user login success

    const token = await signToken({
      id: user.id,
      email: user.email,
    });

    return res.status(200).json({
      status: "success",
      message: " Login success ",
      token,
    });
  } catch (error) {
    return res.status(400).json({
      status: "fail",
      message: "login failed ",
      error,
    });
  }
};

const profile = (
  req: AuthRequest,
  res: Response,
  next: express.NextFunction
) => {
  try {
    return res.status(201).json({
      status: "success",
      message: "User info",
      user: req.user,
    });
  } catch (error) {
    return res.status(400).json({
      status: "fail ",
      message: "User  info ",
      error,
    });
  }
};

export { register, login, profile };
