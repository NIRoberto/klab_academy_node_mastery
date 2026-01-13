# Lesson 4: Authentication & Authorization

## Learning Objectives
- Understand authentication vs authorization
- Implement user registration and login
- Use JWT (JSON Web Tokens) for secure authentication
- Hash passwords securely with bcrypt
- Create protected routes and middleware
- Handle authentication errors properly

---

## 1. Authentication Fundamentals

### What is Authentication?

**Authentication** - Verifies **WHO** the user is (proving identity)
**Authorization** - Determines **WHAT** the user can access (permissions)

### Real-World Example
```
Authentication: "Show me your ID card" (proving who you are)
Authorization: "You can enter VIP section" (what you're allowed to do)
```

### Common Authentication Methods
- **Username/Password** - Traditional login
- **JWT Tokens** - Stateless authentication
- **OAuth** - Third-party login (Google, Facebook)
- **API Keys** - For applications
- **Biometric** - Fingerprint, face recognition

### Authentication Flow
```
1. User registers → Create account
2. User logs in → Verify credentials
3. Server creates token → JWT token
4. Client stores token → localStorage/cookies
5. Client sends token → Authorization header
6. Server verifies token → Grant/deny access
```

---

## 2. Password Security

### Why Hash Passwords?

**Problem:** Storing plain text passwords is dangerous
```typescript
// ❌ NEVER do this
const user = {
  email: 'john@email.com',
  password: 'mypassword123'  // Visible to anyone with database access
};
```

**Solution:** Hash passwords before storing
```typescript
// ✅ Secure approach
const user = {
  email: 'john@email.com',
  password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj'  // Hashed
};
```

### What is Hashing?

**Hashing** - One-way function that converts password to random string
- **Irreversible** - Cannot get original password back
- **Deterministic** - Same password always produces same hash
- **Avalanche Effect** - Small change = completely different hash

### bcrypt - Password Hashing Library

**Installing bcrypt:**
```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

**Basic Usage:**
```typescript
import bcrypt from 'bcryptjs';

// Hash password
const password = 'mypassword123';
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Compare password
const isMatch = await bcrypt.compare(password, hashedPassword);
console.log(isMatch); // true
```

### Salt Rounds Explained
```typescript
// Salt rounds = how many times to hash
const rounds = 10; // Fast, less secure
const rounds = 12; // Recommended for production
const rounds = 15; // Slow, very secure
```

---

## 3. JWT (JSON Web Tokens)

### What is JWT?

**JWT** - Secure way to transmit information between parties as JSON object

### JWT Structure
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

Header.Payload.Signature
```

### JWT Parts Explained
```typescript
// 1. HEADER - Algorithm and token type
{
  "alg": "HS256",
  "typ": "JWT"
}

// 2. PAYLOAD - Data (claims)
{
  "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "email": "john@email.com",
  "iat": 1516239022,  // Issued at
  "exp": 1516325422   // Expires at
}

// 3. SIGNATURE - Verification
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

### Installing JWT
```bash
npm install jsonwebtoken
npm install -D @types/jsonwebtoken
```

### JWT Basic Usage
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

## 4. User Model with Authentication

### Enhanced User Schema
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
  // Only hash if password is modified
  if (!this.isModified('password')) return next();
  
  // Hash password with salt rounds 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
```

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
```

---

## 6. Authentication Controllers

### Auth Controller Functions
```typescript
// controllers/authController.ts
import { Request, Response } from 'express';
import { User } from '../models/User';
import { generateToken } from '../utils/jwt';

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

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists with this email'
      });
    }

    // Create new user (password will be hashed automatically by schema middleware)
    const user = await User.create({
      firstName,
      lastName,
      email,
      password
    });

    // Generate token
    const token = generateToken(user._id.toString());

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

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Check password using schema method
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account is deactivated'
      });
    }

    // Generate token
    const token = generateToken(user._id.toString());

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
```

---

## 7. Authentication Middleware

### Auth Middleware Functions
```typescript
// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { User } from '../models/User';

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
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid token'
      });
    }

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
``` = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied. Insufficient permissions.'
      });
    }
    
    next();
  };
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await AuthService.getUserByToken(token);
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};
```

---

## 8. Protected Routes

### Auth Routes
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

// Public routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Protected routes (login required)
router.post('/', authenticate, createProduct);
router.put('/:id', authenticate, updateProduct);

// Admin only routes
router.delete('/:id', authenticate, authorize(['admin']), deleteProduct);

export default router;
```

---

## 9. Environment Variables

### Authentication Environment Setup
```bash
# .env
# Database
MONGODB_URI=mongodb://localhost:27017/ecommerce

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-make-it-long-and-random-at-least-32-characters
JWT_EXPIRES_IN=7d

# Bcrypt Configuration
BCRYPT_ROUNDS=12

# Server
PORT=3000
NODE_ENV=development
```

### Environment Validation
```typescript
// config/env.ts
import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'PORT'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Validate JWT_SECRET length
if (process.env.JWT_SECRET!.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters long');
  process.exit(1);
}

export const config = {
  mongodbUri: process.env.MONGODB_URI!,
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS!) || 12,
  port: parseInt(process.env.PORT!) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development'
};
```

---

## 10. Testing Authentication

### Using Postman/Thunder Client

**1. Register User:**
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

**2. Login User:**
```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "john@email.com",
  "password": "password123"
}
```

**3. Access Protected Route:**
```http
GET http://localhost:3000/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**4. Create Product (Protected):**
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

---

## 11. Security Best Practices

### Password Security
- **Minimum length** - At least 8 characters
- **Complexity** - Mix of letters, numbers, symbols
- **Salt rounds** - Use 12+ for bcrypt
- **Never log passwords** - Even in development

### JWT Security
- **Strong secret** - At least 32 random characters
- **Short expiration** - 15 minutes to 7 days max
- **Secure storage** - HttpOnly cookies or secure localStorage
- **Token rotation** - Refresh tokens for long sessions

### API Security
- **HTTPS only** - Never send tokens over HTTP
- **Rate limiting** - Prevent brute force attacks
- **Input validation** - Validate all user inputs
- **Error handling** - Don't leak sensitive information

### Common Vulnerabilities
```typescript
// ❌ Don't expose sensitive info in errors
catch (error) {
  res.json({ error: error.message }); // Might leak database info
}

// ✅ Generic error messages
catch (error) {
  console.error(error); // Log for debugging
  res.status(500).json({ error: 'Internal server error' });
}
```

---

## 12. Complete App Integration

### Updated App.ts
```typescript
// app.ts
import express from 'express';
import { connectDB } from './config/database';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import productRoutes from './routes/products';
import { errorHandler } from './middleware/errorHandler';

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

// Error handling middleware
app.use(errorHandler);

export default app;
```

This comprehensive authentication system provides secure user registration, login, and protected routes with proper error handling and security best practices.