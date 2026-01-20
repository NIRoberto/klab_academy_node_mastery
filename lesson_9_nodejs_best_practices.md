# Lesson 9: Node.js Best Practices for Production-Ready Applications

## Table of Contents
1. [Security Best Practices](#security-best-practices)
2. [Performance Optimization](#performance-optimization)
3. [Error Handling & Logging](#error-handling--logging)
4. [Code Quality & Structure](#code-quality--structure)
5. [Testing Strategies](#testing-strategies)
6. [Environment & Configuration](#environment--configuration)
7. [Monitoring & Health Checks](#monitoring--health-checks)
8. [Deployment Best Practices](#deployment-best-practices)

---

## Security Best Practices

### 1. Input Validation & Sanitization

**Install Dependencies:**
```bash
npm install joi express-validator helmet express-rate-limit
```

**Input Validation with Joi:**
```typescript
// src/validators/product.validator.ts
import Joi from 'joi';

export const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  price: Joi.number().positive().required(),
  description: Joi.string().max(500).optional(),
  category: Joi.string().required(),
  quantity: Joi.number().integer().min(0).required(),
});

export const validateProduct = (data: any) => {
  return createProductSchema.validate(data);
};
```

**Validation Middleware:**
```typescript
// src/middlewares/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { validateProduct } from '../validators/product.validator';

export const validateProductInput = (req: Request, res: Response, next: NextFunction) => {
  const { error } = validateProduct(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  
  next();
};
```

### 2. Rate Limiting

```typescript
// src/middlewares/rateLimiter.middleware.ts
import rateLimit from 'express-rate-limit';

// General API rate limiting
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  skipSuccessfulRequests: true,
});
```

### 3. Security Headers with Helmet

```typescript
// src/app.ts
import helmet from 'helmet';

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/v1/auth', authLimiter);
```

### 4. CORS Configuration

```typescript
// src/config/cors.config.ts
import cors from 'cors';

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com', 'https://www.yourdomain.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export default cors(corsOptions);
```

---

## Performance Optimization

### 1. Database Optimization

**MongoDB Indexing:**
```typescript
// src/models/product.model.ts
const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
    index: true, // Index for search
  },
  category: {
    type: String,
    required: true,
    index: true, // Index for filtering
  },
  price: {
    type: Number,
    required: true,
    index: true, // Index for sorting
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true, // Index for date queries
  }
});

// Compound index for complex queries
productSchema.index({ category: 1, price: 1 });
productSchema.index({ name: 'text', description: 'text' }); // Text search
```

### 2. Pagination Implementation

```typescript
// src/controllers/product.controller.ts
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    if (req.query.search) {
      query.$text = { $search: req.query.search as string };
    }

    // Execute query with pagination
    const [products, total] = await Promise.all([
      Product.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Product.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

### 3. Caching with Redis

**Install Redis:**
```bash
npm install redis @types/redis
```

**Redis Configuration:**
```typescript
// src/config/redis.config.ts
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

export default redisClient;
```

**Caching Middleware:**
```typescript
// src/middlewares/cache.middleware.ts
import { Request, Response, NextFunction } from 'express';
import redisClient from '../config/redis.config';

export const cacheMiddleware = (duration: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `cache:${req.originalUrl}`;
    
    try {
      const cachedData = await redisClient.get(key);
      
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }
      
      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = function(data: any) {
        // Cache the response
        redisClient.setEx(key, duration, JSON.stringify(data));
        
        // Call original json method
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Cache error:', error);
      next();
    }
  };
};
```

---

## Error Handling & Logging

### 1. Global Error Handler

```typescript
// src/middlewares/errorHandler.middleware.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger.config';

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
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { name: 'CastError', message, statusCode: 404 } as CustomError;
  }

  // Mongoose duplicate key
  if (err.name === 'MongoError' && (err as any).code === 11000) {
    const message = 'Duplicate field value entered';
    error = { name: 'MongoError', message, statusCode: 400 } as CustomError;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors).map((val: any) => val.message);
    error = { name: 'ValidationError', message: message.join(', '), statusCode: 400 } as CustomError;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});
```

### 2. Logging with Winston

**Install Winston:**
```bash
npm install winston winston-daily-rotate-file
```

**Logger Configuration:**
```typescript
// src/config/logger.config.ts
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'ecommerce-api' },
  transports: [
    // Error logs
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d'
    }),
    
    // Combined logs
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});

// Console logging for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default logger;
```

---

## Code Quality & Structure

### 1. Project Structure

```
src/
├── config/           # Configuration files
│   ├── database.ts
│   ├── redis.ts
│   └── logger.ts
├── controllers/      # Route handlers
├── middlewares/      # Custom middleware
├── models/          # Database models
├── routes/          # Route definitions
├── services/        # Business logic
├── utils/           # Utility functions
├── validators/      # Input validation
├── types/           # TypeScript types
└── tests/           # Test files
```

### 2. Service Layer Pattern

```typescript
// src/services/product.service.ts
import { Product } from '../models/product.model';
import { IProduct } from '../types/product.types';
import logger from '../config/logger.config';

export class ProductService {
  static async createProduct(productData: Partial<IProduct>): Promise<IProduct> {
    try {
      const product = await Product.create(productData);
      logger.info(`Product created: ${product._id}`);
      return product;
    } catch (error) {
      logger.error('Error creating product:', error);
      throw error;
    }
  }

  static async getProductById(id: string): Promise<IProduct | null> {
    try {
      const product = await Product.findById(id);
      if (!product) {
        logger.warn(`Product not found: ${id}`);
      }
      return product;
    } catch (error) {
      logger.error('Error fetching product:', error);
      throw error;
    }
  }

  static async updateProduct(id: string, updateData: Partial<IProduct>): Promise<IProduct | null> {
    try {
      const product = await Product.findByIdAndUpdate(id, updateData, { 
        new: true, 
        runValidators: true 
      });
      
      if (product) {
        logger.info(`Product updated: ${id}`);
      }
      
      return product;
    } catch (error) {
      logger.error('Error updating product:', error);
      throw error;
    }
  }
}
```

### 3. Custom Error Classes

```typescript
// src/utils/customErrors.ts
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}
```

---

## Testing Strategies

### 1. Unit Testing with Jest

**Install Testing Dependencies:**
```bash
npm install -D jest @types/jest supertest @types/supertest ts-jest
```

**Jest Configuration:**
```json
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/tests/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
```

**Unit Test Example:**
```typescript
// src/tests/services/product.service.test.ts
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

jest.mock('../../models/product.model');

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const productData = {
        name: 'Test Product',
        price: 99.99,
        category: 'Electronics',
        quantity: 10
      };

      const mockProduct = { _id: 'mockId', ...productData };
      (Product.create as jest.Mock).mockResolvedValue(mockProduct);

      const result = await ProductService.createProduct(productData);

      expect(Product.create).toHaveBeenCalledWith(productData);
      expect(result).toEqual(mockProduct);
    });

    it('should throw error when creation fails', async () => {
      const productData = { name: 'Test Product' };
      const error = new Error('Database error');
      
      (Product.create as jest.Mock).mockRejectedValue(error);

      await expect(ProductService.createProduct(productData)).rejects.toThrow('Database error');
    });
  });
});
```

### 2. Integration Testing

```typescript
// src/tests/integration/products.test.ts
import request from 'supertest';
import app from '../../app';
import { Product } from '../../models/product.model';

describe('Products API', () => {
  beforeEach(async () => {
    await Product.deleteMany({});
  });

  describe('POST /api/v1/products', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'Test Product',
        price: 99.99,
        category: 'Electronics',
        quantity: 10
      };

      const response = await request(app)
        .post('/api/v1/products')
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(productData.name);
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        price: -10 // Invalid: negative price
      };

      const response = await request(app)
        .post('/api/v1/products')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation error');
    });
  });
});
```

---

## Environment & Configuration

### 1. Environment Variables Management

```typescript
// src/config/env.config.ts
import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  mongoUri: string;
  jwtSecret: string;
  nodeEnv: string;
  redisUrl: string;
  cloudinaryConfig: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000'),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret',
  nodeEnv: process.env.NODE_ENV || 'development',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  cloudinaryConfig: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  }
};

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export default config;
```

### 2. Multiple Environment Files

```bash
# .env.development
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ecommerce_dev
LOG_LEVEL=debug

# .env.production
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb://prod-server:27017/ecommerce_prod
LOG_LEVEL=error

# .env.test
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017/ecommerce_test
LOG_LEVEL=silent
```

---

## Monitoring & Health Checks

### 1. Health Check Endpoint

```typescript
// src/routes/health.routes.ts
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import redisClient from '../config/redis.config';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    checks: {
      database: 'unknown',
      redis: 'unknown',
      memory: process.memoryUsage(),
    }
  };

  try {
    // Check database connection
    if (mongoose.connection.readyState === 1) {
      healthCheck.checks.database = 'connected';
    } else {
      healthCheck.checks.database = 'disconnected';
    }

    // Check Redis connection
    try {
      await redisClient.ping();
      healthCheck.checks.redis = 'connected';
    } catch (error) {
      healthCheck.checks.redis = 'disconnected';
    }

    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.message = 'ERROR';
    res.status(503).json(healthCheck);
  }
});

export default router;
```

### 2. Performance Monitoring

```typescript
// src/middlewares/performance.middleware.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger.config';

export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    // Alert on slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`
      });
    }
  });

  next();
};
```

---

## Deployment Best Practices

### 1. Docker Configuration

**Dockerfile:**
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]
```

**Docker Compose:**
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - mongodb
      - redis
    restart: unless-stopped

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

volumes:
  mongodb_data:
```

### 2. Process Management with PM2

**Install PM2:**
```bash
npm install -g pm2
```

**PM2 Configuration:**
```json
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ecommerce-api',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024'
  }]
};
```

### 3. CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /app
            git pull origin main
            npm ci --production
            npm run build
            pm2 reload ecosystem.config.js --env production
```

---

## Summary Checklist

### ✅ **Security**
- [ ] Input validation with Joi/express-validator
- [ ] Rate limiting implemented
- [ ] Security headers with Helmet
- [ ] CORS properly configured
- [ ] Environment variables secured

### ✅ **Performance**
- [ ] Database indexes created
- [ ] Pagination implemented
- [ ] Caching with Redis
- [ ] Query optimization
- [ ] Image optimization

### ✅ **Reliability**
- [ ] Global error handling
- [ ] Structured logging
- [ ] Health checks
- [ ] Graceful shutdown
- [ ] Process monitoring

### ✅ **Code Quality**
- [ ] TypeScript strict mode
- [ ] ESLint/Prettier configured
- [ ] Unit tests written
- [ ] Integration tests added
- [ ] Code coverage > 80%

### ✅ **Deployment**
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Environment separation
- [ ] Monitoring setup
- [ ] Backup strategy

This comprehensive guide covers the essential best practices for building production-ready Node.js applications. Each section provides practical, implementable solutions that will make your API more secure, performant, and maintainable.