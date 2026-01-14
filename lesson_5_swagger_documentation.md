# Lesson 5: API Documentation with Swagger

## Learning Objectives
- Understand what API documentation is and why it's important
- Learn about Swagger/OpenAPI specification
- Set up Swagger in Express.js application
- Document REST API endpoints
- Add authentication to Swagger documentation
- Test APIs directly from Swagger UI

---

## 1. What is API Documentation?

**API Documentation** is a technical guide that explains how to use and integrate with an API. It describes available endpoints, request/response formats, authentication methods, and error codes.

### Why API Documentation Matters

**1. Developer Experience** - Makes it easy for developers to understand and use your API without reading code.

**2. Faster Integration** - Reduces time needed to integrate with your API from days to hours.

**3. Reduces Support** - Clear documentation means fewer questions and support tickets.

**4. Professional Image** - Well-documented APIs show professionalism and reliability.

---

## 2. What is Swagger?

**Swagger** is a set of tools for designing, building, and documenting REST APIs. It uses the OpenAPI Specification (OAS) to describe your API in a standard format.

### Why Use Swagger?

**1. Interactive Documentation** - Test API endpoints directly from the browser without Postman.

**2. Auto-Generated** - Documentation updates automatically when you change your code.

**3. Industry Standard** - Used by Google, Microsoft, IBM, and most tech companies.

**4. Multiple Languages** - Works with any programming language and framework.

---

## 3. Environment Setup

### Install Dependencies

```bash
npm install swagger-ui-express swagger-jsdoc
npm install -D @types/swagger-ui-express @types/swagger-jsdoc
```

### Package Versions
```json
{
  "dependencies": {
    "swagger-ui-express": "^5.0.0",
    "swagger-jsdoc": "^6.2.8"
  },
  "devDependencies": {
    "@types/swagger-ui-express": "^4.1.6",
    "@types/swagger-jsdoc": "^6.0.4"
  }
}
```

---

## 4. Swagger Configuration

### Create Swagger Config File

```typescript
// config/swagger.config.ts
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Product API Documentation',
      version: '1.0.0',
      description: 'A complete REST API for product management with authentication',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
```

---

## 5. Integrate Swagger into Express

### Update app.ts

```typescript
// app.ts
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.config';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/products.routes';

const app = express();

// Middleware
app.use(express.json());

// Swagger Documentation Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Product API Docs',
}));

// API Routes
const apiV1 = express.Router();
apiV1.use('/auth', authRoutes);
apiV1.use('/products', productRoutes);

app.use('/api/v1', apiV1);

export default app;
```

---

## 6. Swagger Syntax Guide

Before diving into examples, let's understand the basic Swagger annotation syntax:

### Basic Structure

```typescript
/**
 * @swagger
 * /path/to/endpoint:
 *   httpMethod:
 *     summary: Brief description
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: Success message
 */
```

### Common Swagger Keywords

**Path & Method:**
```typescript
/api/v1/products:     // API endpoint path
  get:                // HTTP method (get, post, put, delete)
  post:
  put:
  delete:
```

**Metadata:**
```typescript
summary: "Short description"        // Brief endpoint description
tags: [Products]                    // Group endpoints by category
description: "Detailed explanation" // Long description (optional)
```

**Request Body:**
```typescript
requestBody:
  required: true                    // Is body required?
  content:
    application/json:               // Content type
      schema:                       // Data structure
        type: object                // Data type
        required:                   // Required fields
          - fieldName
        properties:                 // Field definitions
          fieldName:
            type: string            // Field type
            example: "value"        // Example value
```

**Parameters:**
```typescript
parameters:
  - in: path                        // Location: path, query, header
    name: id                        // Parameter name
    required: true                  // Is it required?
    schema:
      type: string                  // Data type
    description: "Parameter info"   // Description
```

**Responses:**
```typescript
responses:
  200:                              // HTTP status code
    description: "Success"          // Response description
    content:
      application/json:             // Response type
        schema:                     // Response structure
          type: object
          properties:
            status:
              type: string
```

**Security:**
```typescript
security:
  - bearerAuth: []                  // Requires JWT authentication
```

### Data Types

```typescript
type: string      // Text: "hello"
type: number      // Numbers: 123, 45.67
type: integer     // Whole numbers: 1, 2, 3
type: boolean     // true or false
type: array       // List: [1, 2, 3]
type: object      // Object: { key: "value" }
```

### Common Formats

```typescript
format: email     // Email address
format: password  // Password field (hidden)
format: date      // Date: 2024-01-01
format: date-time // DateTime: 2024-01-01T10:30:00Z
format: uri       // URL
```

### Quick Reference

```typescript
/**
 * @swagger
 * /api/v1/endpoint:              ← Endpoint path
 *   post:                         ← HTTP method
 *     summary: Description        ← Short description
 *     tags: [Category]            ← Group by category
 *     security:                   ← Authentication
 *       - bearerAuth: []
 *     parameters:                 ← URL/Query params
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:                ← Request data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *     responses:                  ← Response codes
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 */
```

---

## 7. Document Authentication Endpoints

### Register Endpoint Documentation

```typescript
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: User already exists
 */
export const register = async (req: Request, res: Response) => {
  // Controller implementation
};
```

### Login Endpoint Documentation

```typescript
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *       401:
 *         description: Invalid credentials
 */
export const login = async (req: Request, res: Response) => {
  // Controller implementation
};
```

### Profile Endpoint Documentation

```typescript
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
export const profile = (req: AuthRequest, res: Response) => {
  // Controller implementation
};
```

---

## 8. Document Product Endpoints

### Get All Products

```typescript
/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       description:
 *                         type: string
 */
```

### Create Product

```typescript
/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: Laptop
 *               price:
 *                 type: number
 *                 example: 999.99
 *               description:
 *                 type: string
 *                 example: High-performance laptop
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
```

### Update Product

```typescript
/**
 * @swagger
 * /api/v1/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 */
```

### Delete Product

```typescript
/**
 * @swagger
 * /api/v1/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 */
```

---

## 9. Reusable Swagger Components

### Define Reusable Schemas

```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         price:
 *           type: number
 *         description:
 *           type: string
 *     Error:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: fail
 *         message:
 *           type: string
 */
```

### Use Reusable Schemas

```typescript
/**
 * @swagger
 * /api/v1/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

---

## 10. Testing with Swagger UI

### Access Swagger Documentation

1. Start your server:
```bash
npm run dev
```

2. Open browser and navigate to:
```
http://localhost:3000/api-docs
```

### Test Authentication Flow

**Step 1: Register a User**
- Click on `POST /api/v1/auth/register`
- Click "Try it out"
- Fill in the request body
- Click "Execute"
- Copy the token from response

**Step 2: Authorize**
- Click the "Authorize" button at the top
- Enter: `Bearer YOUR_TOKEN_HERE`
- Click "Authorize"
- Click "Close"

**Step 3: Test Protected Routes**
- Now you can test any protected endpoint
- The token is automatically included in requests

---

## 11. Best Practices

### Documentation Guidelines

**1. Be Descriptive** - Clear summaries and descriptions for each endpoint.

**2. Include Examples** - Provide realistic example values for all fields.

**3. Document Errors** - List all possible error responses with status codes.

**4. Keep Updated** - Update documentation when you change your API.

### Swagger Organization

```typescript
// Group endpoints by tags
tags: [Authentication]  // All auth endpoints
tags: [Products]        // All product endpoints
tags: [Users]           // All user endpoints
```

### Security Documentation

```typescript
// Always specify which endpoints require authentication
security:
  - bearerAuth: []
```

---

## 12. Advanced Features

### Custom Swagger UI Theme

```typescript
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 50px 0 }
  `,
  customSiteTitle: 'My API Documentation',
  customfavIcon: '/favicon.ico',
}));
```

### Multiple API Versions

```typescript
// Swagger for v1
app.use('/api-docs/v1', swaggerUi.serve, swaggerUi.setup(swaggerSpecV1));

// Swagger for v2
app.use('/api-docs/v2', swaggerUi.serve, swaggerUi.setup(swaggerSpecV2));
```

---

## 13. Complete Example

### Full Controller with Documentation

```typescript
// controllers/product.controller.ts
import { Request, Response } from 'express';
import { Product } from '../models/product.model';

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Success
 */
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find();
    res.json({ status: 'success', products });
  } catch (error) {
    res.status(500).json({ status: 'fail', message: 'Server error' });
  }
};

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: Create product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Created
 */
export const createProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ status: 'success', product });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: 'Invalid data' });
  }
};
```

---

## Summary

**What You Learned:**
- ✅ What API documentation is and why it matters
- ✅ How to set up Swagger in Express.js
- ✅ Document REST API endpoints with JSDoc comments
- ✅ Add JWT authentication to Swagger
- ✅ Test APIs directly from Swagger UI
- ✅ Create reusable documentation components
- ✅ Follow documentation best practices

**Key Benefits:**
- **Better Developer Experience** - Easy to understand and use your API
- **Faster Development** - Test endpoints without external tools
- **Professional Quality** - Industry-standard documentation
- **Reduced Support** - Self-service documentation for developers

**Next Steps:**
- Add Swagger documentation to all your endpoints
- Customize Swagger UI to match your brand
- Export OpenAPI spec for API client generation
- Share documentation with your team

Your API is now professionally documented and ready for production! 🚀
