# Lesson 4: Authentication & Authorization

## Learning Objectives
- Understand authentication vs authorization
- Implement user registration and login
- Use JWT (JSON Web Tokens) for secure authentication
- Hash passwords securely with bcrypt
- Create protected routes and middleware
- Handle authentication errors properly

---

## 2. Authentication Fundamentals

### What is Authentication?

**Authentication** is the process of verifying the identity of a user or system. It answers the question "Who are you?"

**Authorization** is the process of determining what an authenticated user is allowed to access. It answers the question "What can you do?"

### Key Differences
- **Authentication**: Proves identity (login with username/password)
- **Authorization**: Controls access (admin can delete, user cannot)

### Why Authentication Matters
- **Security**: Protects sensitive data from unauthorized access
- **User Experience**: Provides personalized content and features
- **Compliance**: Meets legal and regulatory requirements
- **Data Integrity**: Ensures only authorized users can modify data

### Authentication Methods
- **Credential-based**: Username/password, email/password
- **Token-based**: JWT, OAuth tokens, API keys
- **Multi-factor**: SMS codes, authenticator apps
- **Biometric**: Fingerprint, facial recognition
- **Certificate-based**: Digital certificates, public key infrastructure

### Authentication Process Flow
```
1. User provides credentials (email/password)
2. Server validates credentials against database
3. Server generates authentication token (JWT)
4. Client stores token (localStorage, cookies)
5. Client includes token in subsequent requests
6. Server verifies token for protected resources
```

---

## 3. Environment Setup

```bash
# .env
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your-super-secret-jwt-key-make-it-long-and-random
PORT=3000
NODE_ENV=development
```

### Install Dependencies
```bash
npm install jsonwebtoken bcryptjs
npm install -D @types/jsonwebtoken @types/bcryptjs
```

---

## 4. Password Security

### Why Password Hashing is Essential

Storing passwords in plain text creates severe security vulnerabilities. If a database is compromised, all user passwords become immediately accessible to attackers.

**Security Risk:**
```typescript
// ❌ NEVER store passwords in plain text
const user = {
  email: 'john@email.com',
  password: 'mypassword123'  // Visible to anyone with database access
};
```

**Secure Solution:**
```typescript
// ✅ Store hashed passwords
const user = {
  email: 'john@email.com',
  password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj'  // Hashed
};
```

### What is Password Hashing?

**Hashing** is a cryptographic function that transforms input data into a fixed-size string of characters. It has these properties:

- **Deterministic**: Same input always produces same output
- **One-way**: Computationally infeasible to reverse
- **Avalanche Effect**: Small input change creates drastically different output
- **Fixed Output Size**: Regardless of input length

### bcrypt - Industry Standard Password Hashing

bcrypt is a password hashing function designed to be slow and computationally expensive, making brute-force attacks impractical.

**Install bcrypt:**
```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

**bcrypt Implementation:**
```typescript
import bcrypt from 'bcryptjs';

// Hash password during registration
const password = 'mypassword123';
const hashedPassword = await bcrypt.hash(password, 12);

// Verify password during login
const isValid = await bcrypt.compare(password, hashedPassword);
console.log(isValid); // true if password matches
```

### Salt Rounds (Work Factor)
```typescript
const rounds = 10; // 2^10 = 1,024 iterations
const rounds = 12; // 2^12 = 4,096 iterations (recommended)
const rounds = 15; // 2^15 = 32,768 iterations (high security)
```

---

## 5. JWT (JSON Web Tokens)

### What is JWT?

**JWT (JSON Web Token)** is an open standard (RFC 7519) for securely transmitting information between parties as a JSON object. JWTs are digitally signed, making them verifiable and trustworthy.

**In Simple Terms:** JWT is a special code that proves you're logged in to a website or app. Think of it like a digital ID card that contains your information.

When you log in successfully, the server gives you this special code. You then show this code every time you want to access something that requires login.

### Why Use JWT? (Simple Reasons)

**1. No Memory Problems**
- Your server doesn't need to remember who's logged in
- Like giving someone a ticket instead of keeping a guest list
- Your app runs faster and uses less memory

**2. Works Everywhere**
- Same login works on your website, mobile app, and API
- Like having one key that opens multiple doors
- Perfect for modern apps that have many parts

**3. Great for Mobile Apps**
- Lightweight and fast for phones and tablets
- Works even when internet is slow or offline
- Users stay logged in without constant server checks

**4. Built-in Security**
- Tokens automatically expire (like parking tickets)
- Can't be faked or tampered with
- Contains user info safely encrypted

**5. Faster User Experience**
- No need to check database every time
- Users get instant access to their stuff
- Less waiting, happier users

**6. Industry Standard**
- Used by Google, Facebook, Netflix, and most modern apps
- Easy to find help and tutorials online
- Future-proof technology choice

### JWT vs Old-School Sessions

| What | JWT | Old Sessions |
|------|-----|-------------|
| **Where stored** | User's device | Server memory |
| **Speed** | Super fast | Slower |
| **Works on mobile** | Perfect | Tricky |
| **Multiple apps** | Easy | Hard |
| **Server memory** | Uses less | Uses more |
| **User experience** | Smooth | Can be choppy |

### What JWT Looks Like

JWT is just a long string of letters and numbers with dots in between:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

Part 1 . Part 2 . Part 3
```

### What's Inside JWT

```typescript
// Part 1 - Basic info about the token
{
  "alg": "HS256",  // How it's secured
  "typ": "JWT"     // What type it is
}

// Part 2 - Your information
{
  "userId": "64f8a1b2c3d4e5f6a7b8c9d0",  // Your unique ID
  "email": "john@email.com",              // Your email
  "iat": 1516239022,  // When it was created
  "exp": 1516325422   // When it expires
}

// Part 3 - Security signature (prevents tampering)
```

### How to Use JWT
```typescript
import jwt from 'jsonwebtoken';

// Create a token when user logs in
const userInfo = { userId: '123', email: 'john@email.com' };
const secret = 'your-secret-key';
const token = jwt.sign(userInfo, secret, { expiresIn: '7d' });

// Check if token is valid
try {
  const user = jwt.verify(token, secret);
  console.log('User is logged in:', user);
} catch (error) {
  console.log('Please log in again');
}
```

---

## 6. User Model with Authentication

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

## 7. JWT Helper Functions

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

---

## 8. Authentication Controllers

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

    // Create new user (password hashed automatically)
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
      data: { user: userResponse, token }
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
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Check password
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
      data: { user: userResponse, token }
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

// GET /auth/me
export const getMe = async (req: any, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user
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

## 7. Authentication Middleware

```typescript
// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { User } from '../models/User';

interface AuthRequest extends Request {
  user?: any;
}

// Authentication middleware
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid token'
      });
    }

    req.user = user;
    next();

  } catch (error: any) {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }
};

// Authorization middleware
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

---

## 8. Role-based Access Control (RBAC)

### What is RBAC?

**Role-based Access Control** determines what actions users can perform based on their assigned roles.

### Common E-commerce Roles (4 Essential Roles)

| Role | Permissions | Use Case |
|---|---|---|
| **Customer** | View products, manage own orders, update profile | Regular shoppers |
| **Vendor** | Manage own products, view own sales | Sellers on marketplace |
| **Admin** | Full access to all resources | Site administrators |
| **Guest** | View products only | Browsing visitors |

### E-commerce Role Implementation

```typescript
// models/User.ts - Updated roles for e-commerce
const UserSchema = new Schema({
  // ... other fields
  role: {
    type: String,
    enum: ['customer', 'vendor', 'admin', 'guest'],
    default: 'customer'
  },
  // Vendor-specific fields
  storeName: {
    type: String,
    required: function() { return this.role === 'vendor'; }
  }
});
```

### E-commerce RBAC Examples

```typescript
// middleware/ecommerceRBAC.ts
import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  user?: any;
}

// Customer can only access their own orders
export const requireCustomerOwnership = (req: AuthRequest, res: Response, next: NextFunction) => {
  const customerId = req.params.customerId || req.body.customerId;
  const currentUserId = req.user._id.toString();
  
  if (currentUserId !== customerId && req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied. You can only access your own orders.'
    });
  }
  next();
};

// Vendor can only manage their own products
export const requireVendorOwnership = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user.role === 'vendor') {
    // Vendor can manage their own products
    return next();
  }
  
  if (req.user.role === 'admin') {
    // Admin can manage any products
    return next();
  }
  
  return res.status(403).json({
    error: 'Access denied. Vendors can only manage their own products.'
  });
};
```

### E-commerce Route Examples

```typescript
// routes/orders.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireCustomerOwnership } from '../middleware/ecommerceRBAC';

const router = Router();

// Customer routes
router.get('/customer/:customerId', authenticate, requireCustomerOwnership, getCustomerOrders);
router.post('/', authenticate, createOrder); // Any authenticated user can create order

// Admin routes
router.get('/all', authenticate, requireRole('admin'), getAllOrders);
router.delete('/:id', authenticate, requireRole('admin'), deleteOrder);

export default router;
```

```typescript
// routes/products.ts - E-commerce specific
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireVendorOwnership, requireAnyRole } from '../middleware/ecommerceRBAC';

const router = Router();

// Public routes
router.get('/', getAllProducts); // Anyone can view products
router.get('/:id', getProductById);

// Vendor and Admin can create products
router.post('/', authenticate, requireAnyRole(['vendor', 'admin']), createProduct);

// Vendor can update own products, Admin can update any
router.put('/:id', authenticate, requireVendorOwnership, updateProduct);

// Only Admin can delete products
router.delete('/:id', authenticate, requireRole('admin'), deleteProduct);

export default router;
```

### E-commerce Permission Matrix (4 Roles)

| Action | Customer | Vendor | Admin | Guest |
|---|---|---|---|---|
| View Products | ✅ | ✅ | ✅ | ✅ |
| Create Products | ❌ | ✅ | ✅ | ❌ |
| Update Own Products | ❌ | ✅ | ✅ | ❌ |
| Update Any Products | ❌ | ❌ | ✅ | ❌ |
| Delete Products | ❌ | ❌ | ✅ | ❌ |
| View Own Orders | ✅ | ✅ | ✅ | ❌ |
| View All Orders | ❌ | ❌ | ✅ | ❌ |
| Create Orders | ✅ | ✅ | ✅ | ❌ |
| Manage Users | ❌ | ❌ | ✅ | ❌ |

### RBAC Implementation Examples

```typescript
// middleware/rbac.ts
import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  user?: any;
}

// Check if user has specific role
export const requireRole = (role: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user.role !== role) {
      return res.status(403).json({
        error: `Access denied. ${role} role required.`
      });
    }
    next();
  };
};

// Check if user has any of the specified roles
export const requireAnyRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }
    next();
  };
};

// Check if user owns the resource or is admin
export const requireOwnershipOrAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  const resourceUserId = req.params.userId || req.body.userId;
  const currentUserId = req.user._id.toString();
  
  if (currentUserId !== resourceUserId && req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied. You can only access your own resources.'
    });
  }
  next();
};
```

### RBAC Route Examples

```typescript
// routes/admin.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole, requireAnyRole } from '../middleware/rbac';
import { getAllUsers, deleteUser, updateUserRole } from '../controllers/adminController';

const router = Router();

// Admin only routes
router.get('/users', authenticate, requireRole('admin'), getAllUsers);
router.delete('/users/:id', authenticate, requireRole('admin'), deleteUser);
router.put('/users/:id/role', authenticate, requireRole('admin'), updateUserRole);

export default router;
```

```typescript
// routes/products.ts - Enhanced with RBAC
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAnyRole, requireOwnershipOrAdmin } from '../middleware/rbac';
import { 
  getAllProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../controllers/productController';

const router = Router();

// Public routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// User and Admin can create products
router.post('/', authenticate, requireAnyRole(['user', 'admin']), createProduct);

// Only owner or admin can update
router.put('/:id', authenticate, requireOwnershipOrAdmin, updateProduct);

// Only admin can delete
router.delete('/:id', authenticate, requireRole('admin'), deleteProduct);

export default router;
```

### RBAC Controller Examples

```typescript
// controllers/adminController.ts
import { Request, Response } from 'express';
import { User } from '../models/User';

// Get all users (Admin only)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      data: users
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

// Delete user (Admin only)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

// Update user role (Admin only)
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
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

### RBAC Testing Examples

```http
# Create admin user (register as normal user first, then update role)
PUT http://localhost:3000/admin/users/USER_ID/role
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json

{
  "role": "admin"
}
```

```http
# Admin accessing all users
GET http://localhost:3000/admin/users
Authorization: Bearer ADMIN_JWT_TOKEN
```

```http
# Regular user trying to access admin route (should fail)
GET http://localhost:3000/admin/users
Authorization: Bearer USER_JWT_TOKEN
```

### RBAC Best Practices

- ✅ **Principle of Least Privilege** - Give minimum required permissions
- ✅ **Role Hierarchy** - Admin > Vendor > Customer > Guest
- ✅ **Resource Ownership** - Users can only modify their own resources
- ✅ **Explicit Permissions** - Clearly define what each role can do
- ✅ **Middleware Validation** - Check permissions before controller execution
- ✅ **Consistent Error Messages** - Use standard 403 Forbidden responses

### Complete 4-Role RBAC Example

```typescript
// Quick setup for 4-role system
const roles = {
  GUEST: 'guest',     // View products only
  CUSTOMER: 'customer', // Place orders, manage profile
  VENDOR: 'vendor',   // Manage own products
  ADMIN: 'admin'      // Full system access
};

// Simple role check middleware
export const hasRole = (allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!allowedRoles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};

// Usage in routes
router.get('/products', hasRole(['guest', 'customer', 'vendor', 'admin']), getProducts);
router.post('/products', hasRole(['vendor', 'admin']), createProduct);
router.delete('/products/:id', hasRole(['admin']), deleteProduct);
```

This completes the authentication and authorization system with a clean 4-role hierarchy suitable for e-commerce applications.le can do
- ✅ **Audit Trail** - Log role changes and admin actions
- ✅ **Role Validation** - Validate roles on both client and server

---

## 9. Routes

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

// Protected routes
router.post('/', authenticate, createProduct);
router.put('/:id', authenticate, updateProduct);

// Admin only routes
router.delete('/:id', authenticate, authorize(['admin']), deleteProduct);

export default router;
```

---

## 10. Testing with Postman

### Register User
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

### Login User
```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "john@email.com",
  "password": "password123"
}
```

### Access Protected Route
```http
GET http://localhost:3000/auth/me
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

---

## 11. Security Best Practices

- ✅ **Hash passwords** with bcrypt (salt rounds 12+)
- ✅ **Strong JWT secret** (32+ characters)
- ✅ **Token expiration** (7 days max)
- ✅ **HTTPS only** in production
- ✅ **Input validation** on all endpoints
- ✅ **Rate limiting** to prevent brute force
- ✅ **Environment variables** for secrets
- ✅ **Error handling** without leaking infos over HTTP
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