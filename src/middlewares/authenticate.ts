import type { Request, Response, NextFunction } from "express";
import { verify } from "../utils/jwt.helper";
import { User } from "../models/user.model";

interface AuthRequest extends Request {
  user?: any;
}

const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: "fail",
        message: "Access denied. No token provided or invalid format.",
      });
    }

    // Extract token from 'Bearer <token>'
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const decodedToken = await verify(token);
    const user = await User.findOne({
      _id: decodedToken.id,
    });
    
    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid token - user not found.",
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      status: "fail",
      message: "Invalid token.",
    });
  }
};

export default authenticate;

export type { AuthRequest };
