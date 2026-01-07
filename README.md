# Node.js Mastery: From Fundamentals to CRUD Application

## Table of Contents
1. [Web Development Fundamentals](#web-development-fundamentals)
2. [Node.js Fundamentals](#nodejs-fundamentals)
3. [NPM and Package Management](#npm-and-package-management)
4. [Express.js Fundamentals](#expressjs-fundamentals)
5. [Express.js Setup](#expressjs-setup)
6. [Middleware](#middleware)
7. [Routing](#routing)
8. [CRUD Operations](#crud-operations)
9. [Error Handling](#error-handling)
10. [Testing](#testing)
11. [Deployment](#deployment)

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
GET    /users     → Retrieve all users
POST   /users     → Create new user
PUT    /users/1   → Update user with ID 1
DELETE /users/1   → Delete user with ID 1
```

### Front-End vs Back-End
- **Front-End**: What users see (HTML, CSS, JavaScript in browser)
- **Back-End**: Server logic, databases, APIs (Node.js, Express)

### Static vs Dynamic vs API
- **Static**: Fixed HTML files (no server processing)
- **Dynamic**: Server generates HTML on request
- **API**: Server returns data (JSON) for front-end apps

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

### Running JavaScript Outside the Browser
```javascript
// Create file: hello.js
console.log("Hello from Node.js!");

// Run in terminal:
// node hello.js
```

## NPM and Package Management

### Key Concepts
- **Package Manager**: Tool for installing, updating, and managing software packages
- **Dependencies**: External libraries or modules that your project needs to function
- **Semantic Versioning**: Version numbering system using MAJOR.MINOR.PATCH format

### Introduction to NPM and package.json
```bash
# Initialize new project
npm init -y

# This creates package.json:
{
  "name": "my-project",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {},
  "devDependencies": {}
}
```

### Types of Packages and Installs
```bash
# Production dependency (needed in production)
npm install express

# Development dependency (only for development)
npm install -D nodemon

# Global install (available system-wide)
npm install -g typescript

# Install specific version
npm install express@4.18.0
```

### 3rd Party Modules Example
```javascript
// After: npm install lodash
const _ = require('lodash');

const numbers = [1, 2, 3, 4, 5];
const doubled = _.map(numbers, n => n * 2);
console.log(doubled); // [2, 4, 6, 8, 10]
```

### Package Versioning
```json
{
  "dependencies": {
    "express": "^4.18.0",  // Compatible version (4.x.x)
    "lodash": "~4.17.21",  // Patch updates only (4.17.x)
    "moment": "2.29.4"     // Exact version
  }
}
```

## Express.js Fundamentals

### Key Concepts
- **Web Framework**: Software framework designed to support web application development
- **Request Object (req)**: Contains information about the HTTP request from the client
- **Response Object (res)**: Used to send HTTP response back to the client

### What is Express.js?
Express is a minimal web framework for Node.js that makes building web servers easier.

### Express vs Vanilla Node.js
**Vanilla Node.js:**
```javascript
const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  const pathname = url.parse(req.url).pathname;
  
  if (pathname === '/users' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ users: [] }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});
```

**With Express:**
```javascript
const express = require('express');
const app = express();

app.get('/users', (req, res) => {
  res.json({ users: [] });
});
```

### Request and Response Objects
```javascript
app.get('/users/:id', (req, res) => {
  // Request object properties
  console.log(req.params.id);    // URL parameters
  console.log(req.query.name);   // Query strings (?name=john)
  console.log(req.body);         // Request body (POST data)
  console.log(req.headers);      // HTTP headers
  
  // Response object methods
  res.status(200);               // Set status code
  res.json({ id: req.params.id }); // Send JSON response
  res.send('Hello');             // Send text response
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
```javascript
// server.js
const express = require('express');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json()); // Parse JSON bodies

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Server Configuration
```javascript
// app.js
const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

module.exports = app;

// server.js
const app = require('./app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Middleware

### Built-in Middleware Examples
```javascript
const express = require('express');
const app = express();

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));
```

### Custom Middleware Examples
```javascript
// Logging middleware
const logger = (req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next(); // Important: call next() to continue
};

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  // Verify token logic here
  req.user = { id: 1, name: 'John' }; // Add user to request
  next();
};

// Use middleware
app.use(logger);
app.use('/protected', authenticate);

app.get('/protected/profile', (req, res) => {
  res.json({ user: req.user });
});
```

## Routing

### Basic Routes Examples
```javascript
const express = require('express');
const app = express();

// GET route
app.get('/users', (req, res) => {
  res.json({ users: ['John', 'Jane'] });
});

// POST route
app.post('/users', (req, res) => {
  const { name, email } = req.body;
  console.log('Creating user:', { name, email });
  res.status(201).json({ id: 1, name, email });
});

// PUT route with parameters
app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  res.json({ id: parseInt(id), name, email });
});

// DELETE route
app.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  res.json({ message: `User ${id} deleted` });
});
```

### Router Module Example
```javascript
// routes/users.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ users: [] });
});

router.post('/', (req, res) => {
  res.status(201).json({ message: 'User created' });
});

router.get('/:id', (req, res) => {
  res.json({ user: { id: req.params.id } });
});

module.exports = router;

// app.js
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Now available:
// GET    /api/users
// POST   /api/users
// GET    /api/users/:id
```

## CRUD Operations

### In-Memory Data Store
```javascript
// Simple in-memory storage
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];
let nextId = 3;
```

### User Controller Example
```javascript
// controllers/UserController.js
class UserController {
  // CREATE
  static create(req, res) {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email required' });
    }
    
    const user = { id: nextId++, name, email };
    users.push(user);
    res.status(201).json(user);
  }

  // READ ALL
  static getAll(req, res) {
    res.json(users);
  }

  // READ ONE
  static getById(req, res) {
    const id = parseInt(req.params.id);
    const user = users.find(u => u.id === id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  }

  // UPDATE
  static update(req, res) {
    const id = parseInt(req.params.id);
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    users[userIndex] = { ...users[userIndex], ...req.body };
    res.json(users[userIndex]);
  }

  // DELETE
  static delete(req, res) {
    const id = parseInt(req.params.id);
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    users.splice(userIndex, 1);
    res.json({ message: 'User deleted successfully' });
  }
}

module.exports = UserController;
```

### Routes Implementation
```javascript
// routes/users.js
const express = require('express');
const UserController = require('../controllers/UserController');
const router = express.Router();

router.post('/', UserController.create);      // POST /api/users
router.get('/', UserController.getAll);       // GET /api/users
router.get('/:id', UserController.getById);   // GET /api/users/:id
router.put('/:id', UserController.update);    // PUT /api/users/:id
router.delete('/:id', UserController.delete); // DELETE /api/users/:id

module.exports = router;
```

## Error Handling

### Global Error Handler Example
```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      message,
      status: statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = errorHandler;

// app.js
const errorHandler = require('./middleware/errorHandler');

// Routes here...

// Error handler must be last
app.use(errorHandler);
```

### Using Error Handler
```javascript
app.get('/users/:id', (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const user = users.find(u => u.id === id);
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    
    res.json(user);
  } catch (error) {
    next(error); // Pass error to error handler
  }
});
```

## Testing

### Jest Setup
```bash
npm install -D jest supertest
```

### Test Examples
```javascript
// tests/users.test.js
const request = require('supertest');
const app = require('../app');

describe('User API', () => {
  test('GET /api/users should return users array', async () => {
    const response = await request(app)
      .get('/api/users')
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('POST /api/users should create user', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com'
    };

    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(userData.name);
    expect(response.body.email).toBe(userData.email);
  });

  test('GET /api/users/:id should return specific user', async () => {
    const response = await request(app)
      .get('/api/users/1')
      .expect(200);
    
    expect(response.body).toHaveProperty('id', 1);
  });
});
```

## Deployment

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "nodemon ts-node src/server.js",
    "start": "node ts-node src/server.js",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

### Environment Variables
```javascript
// .env file
PORT=3000
NODE_ENV=production

// Using in code
const PORT = process.env.PORT || 3000;
const isDevelopment = process.env.NODE_ENV === 'development';
```

## Project Structure
```
my-node-app/
├── src/
│   ├── controllers/
│   │   └── UserController.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── routes/
│   │   └── users.js
│   ├── app.js
│   └── server.js
├── tests/
│   └── users.test.js
├── package.json
└── README.md
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
   npm install -D nodemon jest supertest
   ```

3. **Create basic server**
   ```javascript
   // src/server.js
   import express from "express"  
   const app = express();
   
   app.use(express.json());
   
   app.get('/', (req, res) => {
     res.json({ message: 'Hello World!' });
   });
   
   const PORT = 3000;
   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

4. **Add scripts to package.json**
   ```json
   {
     "scripts": {
       "dev": "nodemon ts-node src/server.js",
       "start": "ts-node src/server.js"
     }
   }
   ```

5. **Run the server**
   ```bash
   npm run dev
   ```

6. **Test in browser or with curl**
   ```bash
   curl http://localhost:3000
   ```

This guide provides practical examples for each concept, making it easier to understand and implement Node.js applications step by step.# klab_academy_node_mastery
