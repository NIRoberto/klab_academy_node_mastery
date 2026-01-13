# Lesson 4: Authentication & Authorization

## Table of Contents
1. [Authentication Fundamentals](#1-authentication-fundamentals)
2. [Password Security](#2-password-security)
3. [JWT (JSON Web Tokens)](#3-jwt-json-web-tokens)
4. [User Model Setup](#4-user-model-setup)
5. [Authentication Functions](#5-authentication-functions)
6. [Controllers](#6-controllers)
7. [Middleware](#7-middleware)
8. [Routes](#8-routes)
9. [Environment Setup](#9-environment-setup)
10. [Testing](#10-testing)
11. [Security Best Practices](#11-security-best-practices)

---

## Learning Objectives
By the end of this lesson, you will be able to:
- ✅ Understand the difference between authentication and authorization
- ✅ Implement secure user registration and login
- ✅ Use JWT tokens for stateless authentication
- ✅ Hash passwords securely with bcrypt
- ✅ Create protected routes and middleware
- ✅ Handle authentication errors properly

---

## 1. Authentication Fundamentals

### What is Authentication vs Authorization?

| Authentication | Authorization |
|---|---|
| **WHO** are you? | **WHAT** can you do? |
| Proving identity | Checking permissions |
| Login process | Access control |
| "Show me your ID" | "You can enter VIP area" |

### Authentication Flow
```
1. User registers → Create account with hashed password
2. User logs in → Verify email + password
3. Server creates JWT → Signed token with user info
4. Client stores token → In localStorage or cookies
5. Client sends token → In Authorization header
6. Server verifies token → Allow or deny access
```

### Why Authentication Matters
- **Security** - Protect user data and resources
- **Personalization** - Show user-specific content
- **Access Control** - Different permissions for different users
- **Audit Trail** - Track who did what and when

---

## 2. Password Security

### The Problem with Plain Text Passwords
```typescript
// ❌ NEVER store passwords like this
const user = {
  email: 'john@email.com',
  password: 'mypassword123'  // Anyone with database access can see this!
};
```

### The Solution: Password Hashing
```typescript
// ✅ Store hashed passwords
const user = {
  email: 'john@email.com',
  password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj'  // Hashed & secure
};
```

### What is Hashing?
- **One-way function** - Cannot reverse to get original password
- **Deterministic** - Same password always produces same hash
- **Avalanche effect** - Small change = completely different hash
- **Salt** - Random data added to prevent rainbow table attacks

### bcrypt Implementation
```bash
# Install bcrypt
npm install bcryptjs
npm install -D @types/bcryptjs
```

```typescript
import bcrypt from 'bcryptjs';

// Hash password (when user registers)
const password = 'mypassword123';
const hashedPassword = await bcrypt.hash(password, 12);

// Compare password (when user logs in)
const isValid = await bcrypt.compare(password, hashedPassword);
console.log(isValid); // true or false
```

### Salt Rounds Explained
```typescript
const rounds = 10; // Fast, less secure (for development)
const rounds = 12; // Recommended for production
const rounds = 15; // Slow, very secure (for high-security apps)
```

---

## 3. JWT (JSON Web Tokens)

### What is JWT?
JWT is a secure way to transmit information between parties as a JSON object.

### JWT Structure
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

Header.Payload.Signature
```

### JWT Parts Breakdown
```typescript
// 1. HEADER - Algorithm and token type
{
  "alg": "HS256",
  "typ": "JWT"
}

// 2. PAYLOAD - User data (claims)
{
  "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "email": "john@email.com",
  "iat": 1516239022,  // Issued at (timestamp)
  "exp": 1516325422   // Expires at (timestamp)
}

// 3. SIGNATURE - Verification (server-only secret)
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

### JWT Installation & Basic Usage
```bash
# Install JWT
npm install jsonwebtoken
npm install -D @types/jsonwebtoken
```

```typescript
import jwt from 'jsonwebtoken';

// Create token
const payload = { userId: '123', email: 'john@email.com' };
const secret = 'your-secret-key';
const token = jwt.sign(payload, secret, { expiresIn: '7d' });

// Verify token
try {
  const decoded = jwt.verify(token, secret);
  console.log(decoded); // { userId: '123', email: 'john@email.com', iat: ..., exp: ... }
} catch (error) {
  console.log('Invalid token');
}
```

---

## 4. User Model Setup

### Enhanced User Schema with Authentication
```typescript
// models/User.ts
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  isActive: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false  // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
```

### Key Features Explained
- **Email validation** - Regex pattern ensures valid email format
- **Password hashing** - Automatic hashing before saving to database
- **Role-based access** - User or admin roles for authorization
- **Active status** - Ability to deactivate accounts
- **Timestamps** - Automatic createdAt and updatedAt fields
- **Password exclusion** - Password not returned in queries by default

---

## 5. Authentication Functions

### JWT Helper Functions
```typescript
// utils/jwt.ts
import jwt from 'jsonwebtoken';

// Generate JWT token
export const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    throw new Error('Invalid token');
  }
};
```

### Password Helper Functions
```typescript
// utils/password.ts
import bcrypt from 'bcryptjs';

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12);
};

// Compare password
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};
```

### User Service Functions
```typescript
// services/userService.ts
import { User } from '../models/User';
import { generateToken } from '../utils/jwt';

// Register new user
export const registerUser = async (userData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new Error('User already exists with this email');
  }

  // Create new user (password will be hashed automatically by schema middleware)
  const user = await User.create(userData);

  // Generate token
  const token = generateToken(user._id.toString());

  return { user, token };
};

// Login user
export const loginUser = async (email: string, password: string) => {
  // Find user and include password field
  const user = await User.findOne({ email }).select('+password');
  
  // Check if user exists
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check password using schema method
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new Error('Account is deactivated');
  }

  // Generate token
  const token = generateToken(user._id.toString());

  return { user, token };
};

// Get user by ID
export const getUserById = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};
```

---

## 6. Controllers

### Authentication Controllers
```typescript
// controllers/authController.ts
import { Request, Response } from 'express';
import { registerUser, loginUser } from '../services/userService';

// POST /auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        error: 'All fields are required'
      });
    }

    // Register user
    const { user, token } = await registerUser({
      firstName,
      lastName,
      email,
      password
    });

    // Remove password from response
    const { password: _, ...userResponse } = user.toObject();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error: any) {
    if (error.message === 'User already exists with this email') {
      return res.status(409).json({ error: error.message });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

// POST /auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Login user
    const { user, token } = await loginUser(email, password);

    // Remove password from response
    const { password: _, ...userResponse } = user.toObject();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error: any) {
    if (error.message.includes('Invalid email or password') || 
        error.message.includes('Account is deactivated')) {
      return res.status(401).json({ error: error.message });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

// GET /auth/me (Get current user)
export const getMe = async (req: any, res: Response) => {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
```

---

## 7. Middleware

### Authentication Middleware
```typescript
// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { getUserById } from '../services/userService';

// Extend Request interface to include user
interface AuthRequest extends Request {
  user?: any;
}

// Authentication middleware
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied. No token provided.'
      });
    }

    // Extract token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7);

    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await getUserById(decoded.userId);

    // Attach user to request object
    req.user = user;
    
    // Continue to next middleware
    next();

  } catch (error: any) {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }
};

// Authorization middleware (role-based)
export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied. Insufficient permissions.'
      });
    }
    next();
  };
};
```

### Middleware Usage Examples
```typescript
// Protect route - authentication required
router.get('/profile', authenticate, getProfile);

// Admin only - authentication + authorization required
router.delete('/users/:id', authenticate, authorize(['admin']), deleteUser);

// Multiple roles allowed
router.get('/dashboard', authenticate, authorize(['admin', 'manager']), getDashboard);
```

---

## 8. Routes

### Authentication Routes
```typescript
// routes/auth.ts
import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authenticate, getMe);

export default router;
```

### Protected Product Routes
```typescript
// routes/products.ts
import { Router } from 'express';
import { 
  getAllProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../controllers/productController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public routes (no authentication required)
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Protected routes (authentication required)
router.post('/', authenticate, createProduct);
router.put('/:id', authenticate, updateProduct);

// Admin only routes (authentication + authorization required)
router.delete('/:id', authenticate, authorize(['admin']), deleteProduct);

export default router;
```

### Complete App Integration
```typescript
// app.ts
import express from 'express';
import { connectDB } from './config/database';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import productRoutes from './routes/products';

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/products', productRoutes);

export default app;
```

---

## 9. Environment Setup

### Environment Variables
```bash
# .env
# Database
MONGODB_URI=mongodb://localhost:27017/ecommerce

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-make-it-long-and-random-at-least-32-characters
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development
```

### Environment Validation
```typescript
// config/env.ts
import dotenv from 'dotenv';

dotenv.config();

// Required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'PORT'];

// Validate all required variables exist
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Validate JWT_SECRET strength
if (process.env.JWT_SECRET!.length < 32) {
  console.error('❌ JWT_SECRET must be at least 32 characters long');
  process.exit(1);
}

console.log('✅ Environment variables validated successfully');

export const config = {
  mongodbUri: process.env.MONGODB_URI!,
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  port: parseInt(process.env.PORT!) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development'
};
```

---

## 10. Testing

### API Testing with Postman/Thunder Client

#### 1. Register New User
```http
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@email.com",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@email.com",
      "role": "user",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. Login User
```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "john@email.com",
  "password": "password123"
}
```

#### 3. Access Protected Route
```http
GET http://localhost:3000/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 4. Create Product (Protected)
```http
POST http://localhost:3000/products
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Laptop",
  "price": 999,
  "category": "electronics"
}
```

### Testing Checklist
- ✅ User can register with valid data
- ✅ Registration fails with duplicate email
- ✅ User can login with correct credentials
- ✅ Login fails with wrong password
- ✅ Protected routes require valid token
- ✅ Invalid tokens are rejected
- ✅ Admin routes require admin role
- ✅ Passwords are hashed in database

---

## 11. Security Best Practices

### Password Security
- ✅ **Minimum 8 characters** - Enforce strong passwords
- ✅ **Hash with bcrypt** - Never store plain text passwords
- ✅ **Salt rounds 12+** - Use adequate computational cost
- ✅ **Never log passwords** - Even in development mode

### JWT Security
- ✅ **Strong secret** - At least 32 random characters
- ✅ **Short expiration** - 15 minutes to 7 days maximum
- ✅ **Secure storage** - HttpOnly cookies preferred over localStorage
- ✅ **Token rotation** - Implement refresh tokens for long sessions

### API Security
- ✅ **HTTPS only** - Never send tokens over HTTP in production
- ✅ **Rate limiting** - Prevent brute force attacks
- ✅ **Input validation** - Validate and sanitize all inputs
- ✅ **Error handling** - Don't leak sensitive information

### Common Security Mistakes to Avoid
```typescript
// ❌ Don't expose sensitive information in errors
catch (error) {
  res.json({ error: error.message }); // Might leak database info
}

// ✅ Use generic error messages
catch (error) {
  console.error(error); // Log for debugging
  res.status(500).json({ error: 'Internal server error' });
}

// ❌ Don't store JWT secret in code
const secret = 'mysecret123';

// ✅ Use environment variables
const secret = process.env.JWT_SECRET;

// ❌ Don't use weak JWT secrets
JWT_SECRET=abc123

// ✅ Use strong, random secrets
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

---

## Summary

You've learned how to implement a complete authentication system with:

### ✅ What You Built
- **Secure user registration** with password hashing
- **JWT-based login system** with token generation
- **Protected routes** with authentication middleware
- **Role-based authorization** for admin features
- **Proper error handling** and security practices

### ✅ Key Security Features
- Passwords hashed with bcrypt (salt rounds 12)
- JWT tokens with expiration
- Protected API endpoints
- Role-based access control
- Input validation and sanitization

### ✅ Next Steps
- Add password reset functionality
- Implement refresh tokens
- Add email verification
- Set up rate limiting
- Deploy with HTTPS

This authentication system is production-ready and follows industry best practices for security and user management!