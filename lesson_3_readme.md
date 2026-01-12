# Lesson 3: MongoDB Integration & Authentication

## 1. Database Integration with MongoDB

### What is MongoDB?

MongoDB is a **NoSQL database** that stores data in flexible, JSON-like documents.

### Why Use MongoDB?

**Problem with In-Memory Data:**
* Data disappears when server restarts
* Cannot handle large amounts of data
* No data persistence
* Cannot share data between multiple servers

**MongoDB Solutions:**
* **Persistent storage** - Data survives server restarts
* **Scalable** - Handles millions of records
* **JSON-like format** - Natural fit for JavaScript/Node.js
* **Flexible schema** - Easy to modify data structure
* **Rich queries** - Complex searching and filtering

### MongoDB vs SQL Databases

| MongoDB (NoSQL) | SQL Databases |
|---|---|
| Documents (JSON-like) | Tables with rows/columns |
| Collections | Tables |
| Flexible schema | Fixed schema |
| Easy to scale horizontally | Complex to scale |
| Great for rapid development | Great for complex relationships |

### Why Use MongoDB with Node.js?

* **Same language** - JavaScript objects ↔ MongoDB documents
* **No complex joins** - Embedded documents instead
* **Fast development** - No need to design rigid schemas upfront
* **JSON everywhere** - API responses match database format

### What is Mongoose?

**Mongoose** is an **ODM (Object Document Mapper)** that makes working with MongoDB easier.

**Without Mongoose (Raw MongoDB):**
```javascript
// Complex and error-prone
db.collection('products').insertOne({
  name: 'Laptop',
  price: 999
}, (err, result) => {
  if (err) throw err;
  console.log(result);
});
```

**With Mongoose (Clean & Simple):**
```typescript
// Clean and validated
const product = new Product({ name: 'Laptop', price: 999 });
await product.save();
```

### Why Use Mongoose?

* **Schema validation** - Ensures data quality
* **Type safety** - Works great with TypeScript
* **Middleware hooks** - Run code before/after operations
* **Query building** - Easier to write complex queries
* **Population** - Handle relationships between collections
* **Built-in validation** - Email validation, required fields, etc.

### Real-World Example

**E-commerce without database:**
```typescript
// ❌ Data lost on restart
let products = [
  { id: 1, name: 'Laptop', price: 999 }
];
```

**E-commerce with MongoDB:**
```typescript
// ✅ Data persisted permanently
const product = await Product.create({
  name: 'Laptop', 
  price: 999
});
```

### Installing MongoDB Packages

```bash
npm install mongoose dotenv
npm install -D @types/mongoose
```

### Key MongoDB Concepts

* **Collections** - Similar to tables in SQL databases
* **Documents** - Individual records (like rows in SQL)
* **Schema** - Structure definition for documents
* **Models** - JavaScript classes that interact with collections

---

## 2. Database Connection Setup

### Environment Variables

Environment variables keep sensitive information secure:

```bash
# .env file
MONGODB_URI=mongodb://localhost:27017/ecommerce
PORT=3000
NODE_ENV=development
```

### Database Connection

```typescript
// config/database.ts
import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};
```

### Server Startup Order

**Important:** Always connect to database BEFORE starting the server

```typescript
// server.ts
const startServer = async () => {
  await connectDB();        // 1. Database first
  app.listen(PORT);         // 2. Then server
};
```

---

## 3. Creating Database Models

### What are Models?

Models define the **structure** and **validation rules** for your data.

### Product Model Example

```typescript
// models/Product.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  price: number;
  description?: string;
  category: string;
  inStock: boolean;
  quantity: number;
}

const ProductSchema = new Schema<IProduct>({
  name: { 
    type: String, 
    required: [true, 'Product name is required'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  price: { 
    type: Number, 
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  description: String,
  category: { 
    type: String, 
    required: [true, 'Category is required'],
    enum: ['electronics', 'clothing', 'books', 'home', 'sports']
  },
  inStock: { 
    type: Boolean, 
    default: true 
  },
  quantity: { 
    type: Number, 
    default: 0,
    min: [0, 'Quantity cannot be negative']
  }
}, {
  timestamps: true  // Automatically adds createdAt and updatedAt
});

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
```

### Schema Validation Features

* **Required fields** - `required: true`
* **Data types** - `String`, `Number`, `Boolean`, `Date`
* **Min/Max values** - `min: 0`, `max: 100`
* **String length** - `maxlength: 100`
* **Enum values** - `enum: ['option1', 'option2']`
* **Default values** - `default: true`
* **Custom messages** - `required: [true, 'Custom error message']`

### Validation Examples

```typescript
// User Model with comprehensive validation
const UserSchema = new Schema({
  // Required field with custom message
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true
  },
  
  // String length validation
  name: {
    type: String,
    required: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
    trim: true  // Remove whitespace
  },
  
  // Number range validation
  age: {
    type: Number,
    min: [18, 'Must be at least 18 years old'],
    max: [100, 'Age cannot exceed 100']
  },
  
  // Enum validation
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'pending'],
      message: 'Status must be active, inactive, or pending'
    },
    default: 'pending'
  },
  
  // Custom validation function
  password: {
    type: String,
    required: true,
    validate: {
      validator: function(password: string) {
        return password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
      },
      message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
    }
  },
  
  // Date validation
  birthDate: {
    type: Date,
    validate: {
      validator: function(date: Date) {
        return date < new Date();
      },
      message: 'Birth date cannot be in the future'
    }
  }
});
```

### What Happens When Validation Fails?

```typescript
// Example: Creating user with invalid data
try {
  const user = await User.create({
    email: '',           // ❌ Required field empty
    name: 'A',          // ❌ Too short (min: 2)
    age: 15,            // ❌ Below minimum (min: 18)
    status: 'unknown',  // ❌ Not in enum values
    password: '123'     // ❌ Doesn't meet custom validation
  });
} catch (error) {
  console.log(error.errors);
  // Returns detailed validation errors for each field
}
```

---

## 4. Database Operations (CRUD)

### Service Layer with Database

Replace in-memory arrays with database operations:

```typescript
// services/ProductService.ts
import { Product, IProduct } from '../models/Product';

// CREATE
export const createProduct = async (productData: Partial<IProduct>): Promise<IProduct> => {
  const product = new Product(productData);
  return await product.save();
};

// READ ALL
export const getAllProducts = async (filters: any = {}) => {
  const query: any = {};
  
  // Add filters
  if (filters.category) query.category = filters.category;
  if (filters.inStock !== undefined) query.inStock = filters.inStock;
  
  // Search functionality
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } }
    ];
  }

  return await Product.find(query).sort({ createdAt: -1 });
};

// READ ONE
export const getProductById = async (id: string): Promise<IProduct | null> => {
  return await Product.findById(id);
};

// UPDATE
export const updateProduct = async (id: string, updateData: Partial<IProduct>): Promise<IProduct | null> => {
  return await Product.findByIdAndUpdate(
    id, 
    updateData, 
    { new: true, runValidators: true }
  );
};

// DELETE
export const deleteProduct = async (id: string): Promise<boolean> => {
  const result = await Product.findByIdAndDelete(id);
  return !!result;
};
```
```

### Database Query Features

* **Filtering** - `Product.find({ category: 'electronics' })`
* **Searching** - `{ $regex: searchTerm, $options: 'i' }`
* **Sorting** - `.sort({ createdAt: -1 })`
* **Pagination** - `.skip(10).limit(5)`
* **Population** - `.populate('fieldName')` for references

---

## 5. Advanced Features

### Pagination

```typescript
export const getAllProducts = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  
  const products = await Product.find()
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Product.countDocuments();

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};
```

### References Between Collections

```typescript
// Cart Model with Product References
const CartSchema = new Schema({
  userId: { type: String, required: true },
  items: [{
    productId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Product',  // Reference to Product model
      required: true 
    },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true }
  }],
  totalAmount: { type: Number, default: 0 }
});

// Populate referenced data
const cart = await Cart.findOne({ userId })
  .populate('items.productId', 'name price imageUrl');
```

---

## 6. Error Handling with Database

### Database Validation Errors

```typescript
// Controller with proper error handling
export const createProduct = async (req: Request, res: Response) => {
  try {
    const product = await createProduct(req.body);
    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error: any) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Duplicate entry',
        message: 'Resource already exists'
      });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
```
```

### Common Database Errors

* **ValidationError** - Schema validation failed
* **CastError** - Invalid ObjectId format
* **MongoError 11000** - Duplicate key violation
* **Connection errors** - Database unavailable

---

## 7. Authentication & Authorization

### What is Authentication?

**Authentication** verifies **who** the user is (login process).

**Authorization** determines **what** the user can access (permissions).

### JWT (JSON Web Tokens)

JWT is a secure way to transmit information between parties.

**Structure:** `header.payload.signature`

### Installing Authentication Packages

```bash
npm install bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken
```

### User Model with Password Hashing

```typescript
// models/User.ts
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin';
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  name: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
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

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
```

### Authentication Service

```typescript
// services/AuthService.ts
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

// Register new user
export const registerUser = async (userData: { email: string; password: string; name: string }): Promise<{ user: IUser; token: string }> => {
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new Error('User already exists');
  }

  const user = await User.create(userData);
  const token = generateToken(user._id);

  return { user, token };
};

// Login user
export const loginUser = async (email: string, password: string): Promise<{ user: IUser; token: string }> => {
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    throw new Error('Invalid credentials');
  }

  const token = generateToken(user._id);
  return { user, token };
};

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
  return jwt.verify(token, process.env.JWT_SECRET!);
};
```
```

### Authentication Middleware

```typescript
// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/AuthService';
import { User } from '../models/User';

interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Authorization middleware
export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};
```

### Protected Routes

```typescript
// routes/products.ts
import { Router } from 'express';
import { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct } from '../controllers/ProductController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Protected routes (authentication required)
router.post('/', authenticate, createProduct);
router.put('/:id', authenticate, updateProduct);

// Admin only routes (authentication + authorization)
router.delete('/:id', authenticate, authorize(['admin']), deleteProduct);

export default router;
```

### Authentication Flow

1. **Register/Login** - User provides credentials
2. **Password Hashing** - Store secure password hash
3. **JWT Generation** - Create signed token
4. **Token Storage** - Client stores token (localStorage/cookies)
5. **Request Authentication** - Send token in Authorization header
6. **Token Verification** - Server validates token
7. **User Authorization** - Check user permissions

### Environment Variables for Auth

```bash
# .env
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
```

---

## 8. Security Best Practices

### Input Validation

* Always validate user input
* Use schema validation
* Sanitize data before database operations
* Implement rate limiting

### Password Security

* Hash passwords with bcrypt
* Use strong JWT secrets
* Implement password complexity rules
* Add password reset functionality

### API Security

* Use HTTPS in production
* Implement CORS properly
* Add request rate limiting
* Validate all inputs
* Use environment variables for secrets