import bcrypt from "bcryptjs";
import express, { Request, Response } from "express";
import { User } from "../models/user.model";
import { signToken } from "../utils/jwt.helper";
import { AuthRequest } from "../middlewares/authenticate";

// Constants for better maintainability
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || "12"); // Higher security than default 10
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;

// Reusable validation function
const validateRequiredFields = (
  fields: Record<string, any>,
  requiredFields: string[]
) => {
  const missingFields = requiredFields.filter((field) => !fields[field]);
  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};

// Reusable error response function
const sendErrorResponse = (
  res: Response,
  status: number,
  message: string,
  error?: any
) => {
  return res.status(status).json({
    status: "fail",
    message,
    ...(error && { error }),
  });
};

// Reusable success response function
const sendSuccessResponse = (
  res: Response,
  status: number,
  message: string,
  data?: any
) => {
  return res.status(status).json({
    status: "success",
    message,
    ...data,
  });
};

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: password123
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: User already exists
 */
const register = async (req: Request, res: Response) => {
  try {
    // Extract user registration data from request body
    const { firstName, lastName, email, password } = req.body;

    // Validate all required fields are provided
    const validation = validateRequiredFields(
      { firstName, lastName, email, password },
      ["firstName", "lastName", "email", "password"]
    );

    if (!validation.isValid) {
      return sendErrorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        `Missing required fields: ${validation.missingFields.join(", ")}`
      );
    }

    // Check if user already exists in database
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return sendErrorResponse(
        res,
        HTTP_STATUS.CONFLICT,
        "User with this email already exists"
      );
    }

    // Hash password for secure storage (never store plain text passwords)
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create new user in database with hashed password
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    // Generate JWT token for immediate login after registration
    const token = await signToken({
      id: newUser.id,
      email: newUser.email,
    });

    // Remove password from response for security
    const { password: _, ...userResponse } = newUser.toObject();

    // Send success response with user data and token
    return sendSuccessResponse(
      res,
      HTTP_STATUS.CREATED,
      "User registered successfully",
      {
        user: userResponse,
        token,
      }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return sendErrorResponse(
      res,
      HTTP_STATUS.INTERNAL_ERROR,
      "Registration failed. Please try again.",
      process.env.NODE_ENV === "development" ? error : undefined
    );
  }
};

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Email and password are required
 *       401:
 *         description: Invalid credentials
 */
const login = async (req: Request, res: Response) => {
  try {
    // Extract login credentials from request body
    const { email, password } = req.body;

    // Validate required login fields
    const validation = validateRequiredFields({ email, password }, [
      "email",
      "password",
    ]);

    if (!validation.isValid) {
      return sendErrorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Email and password are required"
      );
    }

    // Find user by email (include password field for comparison)
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return sendErrorResponse(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        "Invalid email or password"
      );
    }

    // Verify password against stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return sendErrorResponse(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        "Invalid email or password"
      );
    }

    // Generate JWT token for authenticated session
    const token = await signToken({
      id: user.id,
      email: user.email,
    });

    // Send success response with token
    return sendSuccessResponse(res, HTTP_STATUS.OK, "Login successful", {
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return sendErrorResponse(
      res,
      HTTP_STATUS.INTERNAL_ERROR,
      "Login failed. Please try again.",
      process.env.NODE_ENV === "development" ? error : undefined
    );
  }
};

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
const profile = (req: AuthRequest, res: Response) => {
  try {
    // User is already attached to request by authentication middleware
    if (!req.user) {
      return sendErrorResponse(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        "User not found in request. Authentication required."
      );
    }

    // Remove sensitive information before sending response
    const userProfile = {
      id: req.user.id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    };

    // Send user profile data
    return sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      "Profile retrieved successfully",
      {
        user: userProfile,
      }
    );
  } catch (error) {
    console.error("Profile retrieval error:", error);
    return sendErrorResponse(
      res,
      HTTP_STATUS.INTERNAL_ERROR,
      "Failed to retrieve profile. Please try again.",
      process.env.NODE_ENV === "development" ? error : undefined
    );
  }
};

export { register, login, profile };
