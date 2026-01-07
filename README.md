# Node.js Mastery: From Fundamentals to CRUD Application

## Introduction

This guide will take you from Node.js fundamentals to building a complete CRUD application using modern TypeScript and Express.js. You'll learn by building a real product management API.

## Installation

### Prerequisites
- Node.js (v18 or higher)
- npm (comes with Node.js)
- Code editor (VS Code recommended)

### Project Setup
```bash
# Create project directory
mkdir product-api
cd product-api

# Initialize npm project
npm init -y

# Install dependencies
npm install express
npm install -D @types/express @types/node typescript ts-node nodemon

# Create TypeScript config
npx tsc --init

# Create project structure
mkdir src
touch src/server.ts
```

### Package.json Configuration
```json
{
  "name": "product-api",
  "version": "1.0.0",
  "type": "commonjs",
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "start": "ts-node src/server.ts",
    "build": "tsc"
  },
  "dependencies": {
    "express": "^5.2.1"
  },
  "devDependencies": {
    "@types/express": "^5.0.6",
    "@types/node": "^25.0.3",
    "nodemon": "^3.1.11",
    "ts-node": "^10.9.2",
    "typescript": "^5.9.3"
  }
}
```

## Web Development Fundamentals

### Key Concepts
- **Client-Server Architecture**: Model where clients request services from servers over a network
- **HTTP Protocol**: Communication protocol used for transferring data between web browsers and servers
- **Request-Response Cycle**: Process where client sends request to server and receives response back

### How the Web Works
When you type a URL in your browser:
1. Browser sends HTTP request to server
2. Server processes the request
3. Server sends back HTTP response
4. Browser displays the content

### HTTP Methods in Action
```
GET    /products  → Retrieve all products
POST   /products  → Create new product
PUT    /products/1 → Update product with ID 1
DELETE /products/1 → Delete product with ID 1
```

## Node.js Fundamentals

### Key Concepts
- **V8 Engine**: Google's JavaScript engine that compiles JavaScript to machine code
- **Runtime Environment**: Platform that provides everything needed to execute JavaScript code
- **Event Loop**: Mechanism that handles asynchronous operations in Node.js

### What is Node.js and Why Use It?
Node.js lets you run JavaScript on the server instead of just in browsers.

**Benefits:**
- Same language for front-end and back-end
- Fast execution with V8 engine
- Large ecosystem (NPM packages)
- Great for APIs and real-time apps

### Running TypeScript Outside the Browser
```typescript
// Create file: hello.ts
console.log("Hello from Node.js!");

// Run in terminal:
// ts-node hello.ts
```

## NPM and Package Management

### Key Concepts
- **Package Manager**: Tool for installing, updating, and managing software packages
- **Dependencies**: External libraries or modules that your project needs to function
- **Semantic Versioning**: Version numbering system using MAJOR.MINOR.PATCH format

### Introduction to NPM and package.json
```bash
npm init -y
npm install express
npm install -D @types/express typescript ts-node nodemon
```

### 3rd Party Modules Example
```typescript
import _ from 'lodash';

const numbers: number[] = [1, 2, 3, 4, 5];
const doubled = _.map(numbers, n => n * 2);
console.log(doubled); // [2, 4, 6, 8, 10]
```

## Express.js Fundamentals

### Key Concepts
- **Web Framework**: Software framework designed to support web application development
- **Request Object (req)**: Contains information about the HTTP request from the client
- **Response Object (res)**: Used to send HTTP response back to the client

### What is Express.js?
Express is a minimal web framework for Node.js that makes building web servers easier.

### Request and Response Objects
```typescript
import { Request, Response } from 'express';

app.get('/products', (req: Request, res: Response) => {
  console.log(req.hostname);     // Server hostname
  console.log(req.params);       // URL parameters
  console.log(req.query);        // Query strings (?name=john)
  
  res.send({ products });        // Send response
});
```

## Express.js Setup

### Installation
```bash
npm init -y
npm install express
npm install -D @types/express typescript ts-node nodemon
```

### Basic Server
```typescript
// server.ts
import express from "express";
import type { Request, Response } from "express";

const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
  console.log("Welcome to my node app ");
  return res.send("Welcome to my node app ");
});

app.listen(PORT, () => {
  console.log("Server is up and running on port " + PORT);
});
```

## Middleware

### Built-in Middleware
```typescript
import express from 'express';

const app = express();

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
```

### Custom Middleware
```typescript
import { Request, Response, NextFunction } from 'express';

const logger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
};

app.use(logger);
```

## Routing

### Basic Routes
```typescript
import express from "express";
import type { Request, Response } from "express";

const app = express();

// GET route for products
app.get("/products", (req: Request, res: Response) => {
  console.log(req.hostname);
  
  return res.send({
    products: products,
  });
});
```

### Router Module
```typescript
// routes/products.ts
import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({ products });
});

export default router;

// app.ts
import productRoutes from './routes/products';
app.use('/api/products', productRoutes);
```

## CRUD Operations

### In-Memory Data Store
```typescript
interface Product {
  id: number;
  name: string;
  price: number;
}

const products: Product[] = [
  { id: 1, name: "Product 1", price: 10 },
  { id: 2, name: "Product 2", price: 20 },
  { id: 3, name: "Product 3", price: 30 },
  { id: 4, name: "Product 4", price: 40 },
];
```

### Product Controller
```typescript
import { Request, Response } from 'express';

export class ProductController {
  // CREATE
  static create(req: Request, res: Response) {
    const { name, price } = req.body;
    const product = { id: Date.now(), name, price };
    products.push(product);
    res.status(201).json(product);
  }

  // READ ALL
  static getAll(req: Request, res: Response) {
    res.json(products);
  }

  // READ ONE
  static getById(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const product = products.find(p => p.id === id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  }

  // UPDATE
  static update(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    products[productIndex] = { ...products[productIndex], ...req.body };
    res.json(products[productIndex]);
  }

  // DELETE
  static delete(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    products.splice(productIndex, 1);
    res.json({ message: 'Product deleted successfully' });
  }
}
```

## Error Handling

### Global Error Handler
```typescript
import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: { message, status: statusCode }
  });
};

// Usage
app.use(errorHandler);
```

## Testing

### Jest Setup
```bash
npm install -D jest @types/jest supertest @types/supertest
```

### Test Example
```typescript
import request from 'supertest';
import app from '../src/app';

describe('Product API', () => {
  test('GET /api/products should return products', async () => {
    const response = await request(app)
      .get('/api/products')
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
  });
});
```

## Deployment

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "start": "ts-node src/server.ts",
    "test": "jest"
  }
}
```

## Project Structure
```
src/
├── controllers/
│   └── ProductController.ts
├── middleware/
│   └── errorHandler.ts
├── routes/
│   └── products.ts
├── app.ts
└── server.ts
```

## Getting Started

1. **Initialize project**
   ```bash
   mkdir my-node-app
   cd my-node-app
   npm init -y
   ```

2. **Install dependencies**
   ```bash
   npm install express
   npm install -D @types/express typescript ts-node nodemon
   ```

3. **Create basic server**
   ```typescript
   // src/server.ts
   import express from "express";
   
   const app = express();
   const PORT = 3000;
   
   app.get("/", (req, res) => {
     res.send("Hello World!");
   });
   
   app.listen(PORT, () => {
     console.log("Server running on port " + PORT);
   });
   ```

4. **Run the server**
   ```bash
   npm run dev
   ```

This guide provides a single, consistent example using modern TypeScript and your actual codebase structure.