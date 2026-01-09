# Learn more about REST

## What is Middleware?

Middleware is a function that sits between the request and response in your Express application. Think of it as a checkpoint that every request must pass through.

### How Middleware Works
```
Request → Middleware 1 → Middleware 2 → Route Handler → Response
```

### Basic Middleware Structure
```typescript
const middleware = (req: Request, res: Response, next: NextFunction) => {
  // Do something with the request
  console.log('Processing request...');
  
  // Call next() to continue to the next middleware
  next();
};
```

### Built-in Middleware Example
```typescript
import express from 'express';

const app = express();

// Parse JSON bodies - runs on every request
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
```

### Custom Middleware Example
```typescript
import { Request, Response, NextFunction } from 'express';

// Logger middleware - logs every request
const logger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next(); // IMPORTANT: Must call next() to continue
};

// Use the middleware
app.use(logger);

// Now every request will be logged
app.get('/products', (req, res) => {
  res.json({ products: [] });
});
```

### Key Points
- Middleware runs in order
- Always call `next()` to continue
- Can modify `req` and `res` objects
- Can end the request-response cycle
- Used for logging, authentication, parsing, etc.

## MongoDB Database Basics

### What is MongoDB?
MongoDB is a NoSQL database that stores data in flexible, JSON-like documents instead of traditional tables.

### Installation
```bash
# Install MongoDB driver
npm install mongodb
npm install -D @types/mongodb

# Or use Mongoose (MongoDB ODM)
npm install mongoose
npm install -D @types/mongoose
```

### Basic MongoDB Connection
```typescript
// config/database.ts
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/productdb';
const client = new MongoClient(uri);

export const connectDB = async () => {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    return client.db();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
```

### Using Mongoose (Recommended)
```typescript
// config/database.ts
import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/productdb');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};
```

### Product Schema with Mongoose
```typescript
// models/Product.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  price: number;
  description?: string;
  createdAt: Date;
}

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
```

### CRUD Operations with MongoDB
```typescript
// services/ProductService.ts
import { Product, IProduct } from '../models/Product';

export class ProductService {
  // CREATE
  static async createProduct(productData: Partial<IProduct>) {
    const product = new Product(productData);
    return await product.save();
  }

  // READ ALL
  static async getAllProducts() {
    return await Product.find();
  }

  // READ ONE
  static async getProductById(id: string) {
    return await Product.findById(id);
  }

  // UPDATE
  static async updateProduct(id: string, updateData: Partial<IProduct>) {
    return await Product.findByIdAndUpdate(id, updateData, { new: true });
  }

  // DELETE
  static async deleteProduct(id: string) {
    return await Product.findByIdAndDelete(id);
  }
}
```

### Updated Controller with Database
```typescript
// controllers/ProductController.ts
import { Request, Response } from 'express';
import { ProductService } from '../services/ProductService';

export class ProductController {
  static async create(req: Request, res: Response) {
    try {
      const product = await ProductService.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const products = await ProductService.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const product = await ProductService.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const product = await ProductService.updateProduct(req.params.id, req.body);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const product = await ProductService.deleteProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

### Connect Database in Server
```typescript
// server.ts
import app from './app';
import { connectDB } from './config/database';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
```

### Environment Variables
```bash
# .env
MONGODB_URI=mongodb://localhost:27017/productdb
PORT=3000
```

## Professional Node.js Folder Structure

### Basic Structure
```
project-root/
├── src/
│   ├── controllers/
│   │   └── ProductController.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── errorHandler.ts
│   ├── routes/
│   │   └── products.ts
│   ├── models/
│   │   └── Product.ts
│   ├── services/
│   │   └── ProductService.ts
│   ├── utils/
│   │   └── helpers.ts
│   ├── config/
│   │   └── database.ts
│   ├── app.ts
│   └── server.ts
├── tests/
│   └── products.test.ts
├── dist/
├── node_modules/
├── package.json
├── tsconfig.json
└── README.md
```

### Folder Responsibilities

**controllers/** - Handle HTTP requests and responses
```typescript
// controllers/ProductController.ts
export class ProductController {
  static async getAll(req: Request, res: Response) {
    const products = await ProductService.getAllProducts();
    res.json(products);
  }
}
```

**services/** - Business logic and data processing
```typescript
// services/ProductService.ts
export class ProductService {
  static async getAllProducts() {
    // Business logic here
    return products;
  }
}
```

**routes/** - Define API endpoints
```typescript
// routes/products.ts
import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';

const router = Router();
router.get('/', ProductController.getAll);

export default router;
```

**middleware/** - Custom middleware functions
```typescript
// middleware/auth.ts
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // Authentication logic
  next();
};
```

**models/** - Data structures and interfaces
```typescript
// models/Product.ts
export interface Product {
  id: number;
  name: string;
  price: number;
}
```

**config/** - Configuration files
```typescript
// config/database.ts
export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432
};
```

**utils/** - Helper functions
```typescript
// utils/helpers.ts
export const formatPrice = (price: number): string => {
  return `$${price.toFixed(2)}`;
};
```

### Main Application Files

**app.ts** - Express app configuration
```typescript
import express from 'express';
import productRoutes from './routes/products';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(express.json());
app.use('/api/products', productRoutes);
app.use(errorHandler);

export default app;
```

**server.ts** - Server startup
```typescript
import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Benefits of This Structure
- **Separation of Concerns**: Each folder has a specific purpose
- **Scalability**: Easy to add new features
- **Maintainability**: Code is organized and easy to find
- **Testing**: Clear structure for unit tests
- **Team Collaboration**: Everyone knows where to find/add code

## Common Node.js Packages & Best Practices

### Essential Production Packages
```bash
# Core Framework
npm install express

# Database
npm install mongoose          # MongoDB ODM
npm install pg                 # PostgreSQL
npm install mysql2             # MySQL

# Environment Variables
npm install dotenv

# Security
npm install helmet             # Security headers
npm install cors               # Cross-origin requests
npm install bcryptjs           # Password hashing
npm install jsonwebtoken       # JWT tokens

# Validation
npm install joi                # Data validation
npm install express-validator  # Express validation

# Logging
npm install winston            # Advanced logging
npm install morgan             # HTTP request logger

# File Upload
npm install multer             # File uploads

# Date/Time
npm install moment             # Date manipulation
npm install date-fns           # Modern date utility
```

### Essential Development Packages
```bash
# TypeScript
npm install -D typescript @types/node @types/express
npm install -D ts-node tsx

# Development Tools
npm install -D nodemon         # Auto-restart server
npm install -D concurrently    # Run multiple commands

# Testing
npm install -D jest @types/jest
npm install -D supertest @types/supertest

# Code Quality
npm install -D eslint @typescript-eslint/parser
npm install -D prettier        # Code formatting
npm install -D husky           # Git hooks

# Build Tools
npm install -D rimraf          # Cross-platform rm -rf
```

### Security Best Practices
```typescript
// app.ts
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Input validation
import Joi from 'joi';

const productSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  price: Joi.number().positive().required(),
  description: Joi.string().max(500)
});

// Validate middleware
const validateProduct = (req: Request, res: Response, next: NextFunction) => {
  const { error } = productSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};
```

### Environment Configuration
```typescript
// config/env.ts
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/productdb',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  nodeEnv: process.env.NODE_ENV || 'development'
};
```

### Logging Best Practices
```typescript
// utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

### Error Handling Best Practices
```typescript
// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logger.error(err.message, { stack: err.stack, url: req.url, method: req.method });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation Error', details: err.message });
  }

  // MongoDB duplicate key error
  if (err.name === 'MongoError' && (err as any).code === 11000) {
    return res.status(400).json({ error: 'Duplicate field value' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal Server Error';

  res.status(statusCode).json({
    error: { message, status: statusCode }
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```



### Key Best Practices
1. **Use TypeScript** for better code quality and developer experience
2. **Environment Variables** for configuration (never hardcode secrets)
3. **Input Validation** on all endpoints
4. **Error Handling** with proper logging
5. **Security Middleware** (helmet, cors, rate limiting)
6. **Structured Logging** with Winston
7. **Testing** with Jest and Supertest
8. **Code Formatting** with Prettier and ESLint
9. **Git Hooks** with Husky for pre-commit checks
10. **Documentation** with clear README and API docs);
```

### Benefits of This Structure
- **Separation of Concerns**: Each folder has a specific purpose
- **Scalability**: Easy to add new features
- **Maintainability**: Code is organized and easy to find
- **Testing**: Clear structure for unit tests
- **Team Collaboration**: Everyone knows where to find/add code