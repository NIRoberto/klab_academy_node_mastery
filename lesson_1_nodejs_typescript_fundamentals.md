# Lesson 1: Node.js Fundamentals & TypeScript Setup

## Table of Contents
1. [What is Node.js?](#what-is-nodejs)
2. [Why Use Node.js?](#why-use-nodejs)
3. [Installing Node.js](#installing-nodejs)
4. [Node.js Basics](#nodejs-basics)
5. [Setting Up TypeScript](#setting-up-typescript)
6. [Creating Your First Node.js + TypeScript Project](#creating-your-first-nodejs--typescript-project)
7. [Understanding package.json](#understanding-packagejson)
8. [Running Your Application](#running-your-application)

---

## What is Node.js?

**Node.js** is a JavaScript runtime built on Chrome's V8 JavaScript engine that lets you run JavaScript on the server (outside the browser).

**Think of it like:**
- Browser: Runs JavaScript for websites
- Node.js: Runs JavaScript for servers, APIs, and command-line tools

**Key Components:**

1. **V8 Engine**
   - Google's JavaScript engine
   - Compiles JavaScript to machine code
   - Makes JavaScript super fast

2. **Event Loop**
   - Handles asynchronous operations
   - Allows Node.js to handle many requests at once
   - Non-blocking I/O (doesn't wait for slow operations)

3. **NPM (Node Package Manager)**
   - Largest software registry in the world
   - Install and manage packages (libraries)
   - Share your own packages

---

## Why Use Node.js?

### ✅ Advantages

1. **Same Language Everywhere**
   ```
   Frontend (React): JavaScript
   Backend (Node.js): JavaScript
   Database (MongoDB): JavaScript-like queries
   ```
   - No context switching between languages
   - Share code between frontend and backend

2. **Fast & Scalable**
   - Non-blocking I/O
   - Handles thousands of concurrent connections
   - Perfect for real-time applications

3. **Huge Ecosystem**
   - 2+ million packages on NPM
   - Solutions for almost any problem
   - Active community

4. **Great for APIs**
   - Build RESTful APIs quickly
   - JSON native support
   - Easy to integrate with databases

### ❌ Not Ideal For

- CPU-intensive tasks (video encoding, image processing)
- Heavy computational work
- Use Python, Go, or Java for these instead

---

## Installing Node.js

### Step 1: Download Node.js

**Option 1: Official Website (Recommended for Beginners)**
1. Go to [nodejs.org](https://nodejs.org)
2. Download **LTS version** (Long Term Support)
   - More stable
   - Recommended for production
3. Run the installer
4. Follow installation wizard

**Option 2: Using NVM (Node Version Manager) - Advanced**
```bash
# Install NVM (macOS/Linux)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js
nvm install --lts
nvm use --lts
```

### Step 2: Verify Installation

```bash
# Check Node.js version
node --version
# Should show: v18.x.x or higher

# Check NPM version
npm --version
# Should show: 9.x.x or higher
```

**If you see version numbers, you're ready!** ✅

---

## Node.js Basics

### Running JavaScript with Node.js

**Create a file: `hello.js`**
```javascript
console.log("Hello from Node.js!");

const name = "John";
const age = 25;

console.log(`My name is ${name} and I'm ${age} years old`);
```

**Run it:**
```bash
node hello.js
# Output: Hello from Node.js!
#         My name is John and I'm 25 years old
```

### Node.js Modules

**Built-in Modules (No installation needed):**

```javascript
// File System module
const fs = require('fs');

// Read a file
const data = fs.readFileSync('file.txt', 'utf8');
console.log(data);

// Write to a file
fs.writeFileSync('output.txt', 'Hello World!');
```

```javascript
// HTTP module
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World!');
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

---

## Setting Up TypeScript

### What is TypeScript?

**TypeScript** is JavaScript with types. It helps catch errors before running your code.

**JavaScript (No types):**
```javascript
function add(a, b) {
  return a + b;
}

add(5, "10"); // Returns "510" (string concatenation) - Bug! 🐛
```

**TypeScript (With types):**
```typescript
function add(a: number, b: number): number {
  return a + b;
}

add(5, "10"); // Error: Argument of type 'string' is not assignable to parameter of type 'number' ✅
```

### Why Use TypeScript?

✅ **Catch errors early** (before running code)
✅ **Better IDE support** (autocomplete, refactoring)
✅ **Self-documenting code** (types explain what code does)
✅ **Easier to maintain** large projects
✅ **Industry standard** (used by Google, Microsoft, Airbnb)

---

## Creating Your First Node.js + TypeScript Project

### Step 1: Create Project Directory

```bash
# Create folder
mkdir my-first-node-app
cd my-first-node-app
```

### Step 2: Initialize NPM

```bash
npm init -y
```

This creates `package.json` - the configuration file for your project.

### Step 3: Install TypeScript

```bash
# Install TypeScript as dev dependency
npm install -D typescript @types/node

# Install ts-node (runs TypeScript directly)
npm install -D ts-node

# Install nodemon (auto-restart on file changes)
npm install -D nodemon
```

**What each package does:**
- `typescript`: TypeScript compiler
- `@types/node`: Type definitions for Node.js
- `ts-node`: Run TypeScript files directly (no manual compilation)
- `nodemon`: Auto-restart server when files change

### Step 4: Create TypeScript Configuration

```bash
npx tsc --init
```

This creates `tsconfig.json`. Update it:

```json
{
  "compilerOptions": {
    // Where your TypeScript files are
    "rootDir": "./src",
    
    // Where compiled JavaScript goes
    "outDir": "./dist",
    
    // Use CommonJS modules (for Node.js)
    "module": "commonjs",
    
    // Target ES2020 JavaScript
    "target": "es2020",
    
    // Enable all strict type checking
    "strict": true,
    
    // Better import/export compatibility
    "esModuleInterop": true,
    
    // Skip type checking of declaration files
    "skipLibCheck": true,
    
    // Generate source maps for debugging
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 5: Create Project Structure

```bash
# Create src folder
mkdir src

# Create main file
touch src/index.ts
```

**Your project structure:**
```
my-first-node-app/
├── src/
│   └── index.ts
├── node_modules/
├── package.json
└── tsconfig.json
```

### Step 6: Write Your First TypeScript Code

**src/index.ts:**
```typescript
// Define a function with types
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// Define an interface (custom type)
interface Person {
  name: string;
  age: number;
  email: string;
}

// Create a person object
const person: Person = {
  name: "John Doe",
  age: 25,
  email: "john@example.com"
};

// Use the function
console.log(greet(person.name));
console.log(`Age: ${person.age}`);
console.log(`Email: ${person.email}`);

// TypeScript will catch this error:
// const invalidPerson: Person = {
//   name: "Jane",
//   age: "25", // Error: Type 'string' is not assignable to type 'number'
//   email: "jane@example.com"
// };
```

### Step 7: Update package.json Scripts

```json
{
  "name": "my-first-node-app",
  "version": "1.0.0",
  "type": "commonjs",
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "devDependencies": {
    "@types/node": "^25.0.3",
    "nodemon": "^3.1.11",
    "ts-node": "^10.9.2",
    "typescript": "^5.9.3"
  }
}
```

**Script explanations:**
- `npm run dev`: Run in development (auto-restart on changes)
- `npm run build`: Compile TypeScript to JavaScript
- `npm start`: Run compiled JavaScript (production)

---

## Understanding package.json

**package.json** is the heart of your Node.js project.

```json
{
  "name": "my-first-node-app",
  "version": "1.0.0",
  "description": "My first Node.js app with TypeScript",
  "main": "dist/index.js",
  "type": "commonjs",
  
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  
  "keywords": ["nodejs", "typescript"],
  "author": "Your Name",
  "license": "ISC",
  
  "dependencies": {
    // Packages needed in production
  },
  
  "devDependencies": {
    // Packages needed only for development
    "@types/node": "^25.0.3",
    "nodemon": "^3.1.11",
    "ts-node": "^10.9.2",
    "typescript": "^5.9.3"
  }
}
```

### Key Fields Explained

**name**: Project name (lowercase, no spaces)
**version**: Project version (follows semantic versioning)
**main**: Entry point file
**type**: Module system (`commonjs` for Node.js)
**scripts**: Commands you can run with `npm run`
**dependencies**: Packages needed in production
**devDependencies**: Packages needed only for development

### Dependencies vs DevDependencies

**dependencies** (Production):
```bash
npm install express mongoose
```
- Needed when app runs in production
- Examples: express, mongoose, dotenv

**devDependencies** (Development only):
```bash
npm install -D typescript @types/node nodemon
```
- Only needed during development
- Examples: TypeScript, type definitions, testing tools

---

## Running Your Application

### Development Mode (with auto-restart)

```bash
npm run dev
```

**What happens:**
1. Nodemon watches for file changes
2. When you save a file, it automatically restarts
3. ts-node runs TypeScript directly (no manual compilation)

**Output:**
```
[nodemon] starting `ts-node src/index.ts`
Hello, John Doe!
Age: 25
Email: john@example.com
[nodemon] clean exit - waiting for changes before restart
```

### Build for Production

```bash
npm run build
```

**What happens:**
1. TypeScript compiler (`tsc`) runs
2. Compiles all `.ts` files to `.js`
3. Output goes to `dist/` folder
4. Creates source maps for debugging

**Your project after build:**
```
my-first-node-app/
├── src/
│   └── index.ts
├── dist/              ← New folder!
│   ├── index.js       ← Compiled JavaScript
│   └── index.js.map   ← Source map
├── node_modules/
├── package.json
└── tsconfig.json
```

### Run Production Build

```bash
npm start
```

Runs the compiled JavaScript from `dist/index.js`.

---

## Common Commands Cheat Sheet

```bash
# Initialize new project
npm init -y

# Install package (production)
npm install express

# Install package (development)
npm install -D typescript

# Install all dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Check Node.js version
node --version

# Check NPM version
npm --version

# Run TypeScript file directly
npx ts-node src/index.ts

# Compile TypeScript
npx tsc
```

---

## TypeScript Basics

### Basic Types

```typescript
// String
let name: string = "John";

// Number
let age: number = 25;

// Boolean
let isStudent: boolean = true;

// Array
let numbers: number[] = [1, 2, 3, 4, 5];
let names: string[] = ["John", "Jane", "Bob"];

// Object
let person: { name: string; age: number } = {
  name: "John",
  age: 25
};

// Any (avoid using this!)
let anything: any = "can be anything";
```

### Interfaces

```typescript
// Define structure of an object
interface User {
  id: number;
  name: string;
  email: string;
  age?: number; // Optional property (?)
}

// Use the interface
const user: User = {
  id: 1,
  name: "John Doe",
  email: "john@example.com"
  // age is optional, so we can omit it
};

// Function using interface
function printUser(user: User): void {
  console.log(`${user.name} (${user.email})`);
}

printUser(user);
```

### Functions with Types

```typescript
// Function with typed parameters and return type
function add(a: number, b: number): number {
  return a + b;
}

// Function with no return value
function logMessage(message: string): void {
  console.log(message);
}

// Arrow function with types
const multiply = (a: number, b: number): number => {
  return a * b;
};

// Optional parameters
function greet(name: string, greeting?: string): string {
  if (greeting) {
    return `${greeting}, ${name}!`;
  }
  return `Hello, ${name}!`;
}

console.log(greet("John")); // Hello, John!
console.log(greet("John", "Good morning")); // Good morning, John!
```

### Type Aliases

```typescript
// Create custom types
type ID = string | number;
type Status = "pending" | "approved" | "rejected";

interface Product {
  id: ID;
  name: string;
  price: number;
  status: Status;
}

const product: Product = {
  id: "prod-123", // Can be string or number
  name: "Laptop",
  price: 999,
  status: "approved" // Must be one of the three values
};
```

---

## Project Structure Best Practices

```
my-node-app/
├── src/
│   ├── config/          # Configuration files
│   │   └── database.ts
│   ├── controllers/     # Business logic
│   │   └── userController.ts
│   ├── models/          # Data models
│   │   └── User.ts
│   ├── routes/          # API routes
│   │   └── userRoutes.ts
│   ├── middlewares/     # Custom middleware
│   │   └── auth.ts
│   ├── utils/           # Helper functions
│   │   └── logger.ts
│   └── index.ts         # Entry point
├── dist/                # Compiled JavaScript (generated)
├── node_modules/        # Dependencies (generated)
├── .env                 # Environment variables
├── .gitignore          # Git ignore file
├── package.json        # Project configuration
└── tsconfig.json       # TypeScript configuration
```

---

## Environment Variables

### Create .env file

```bash
# .env
PORT=3000
DATABASE_URL=mongodb://localhost:27017/myapp
JWT_SECRET=your-secret-key
NODE_ENV=development
```

### Install dotenv

```bash
npm install dotenv
```

### Use in your code

```typescript
// src/index.ts
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;

console.log(`Server will run on port ${PORT}`);
console.log(`Database URL: ${DATABASE_URL}`);
```

### Add .env to .gitignore

```
# .gitignore
node_modules/
dist/
.env
*.log
```

---

## Troubleshooting

### Error: "Cannot find module"

**Problem**: TypeScript can't find a module

**Solution**:
```bash
# Install the package
npm install package-name

# Install type definitions
npm install -D @types/package-name
```

### Error: "tsc: command not found"

**Problem**: TypeScript not installed globally

**Solution**:
```bash
# Use npx to run local TypeScript
npx tsc

# Or install globally (not recommended)
npm install -g typescript
```

### Error: "Port already in use"

**Problem**: Another process is using the port

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

---

## Summary

### What You Learned

✅ What Node.js is and why to use it
✅ How to install Node.js and NPM
✅ What TypeScript is and its benefits
✅ How to set up a TypeScript project
✅ Understanding package.json
✅ Basic TypeScript syntax
✅ Project structure best practices
✅ How to run and build your application

### Next Steps

- [ ] Create your first Node.js + TypeScript project
- [ ] Practice TypeScript basics
- [ ] Learn about Express.js (Lesson 2)
- [ ] Build a simple API
- [ ] Connect to a database

---

## Quick Start Template

```bash
# 1. Create project
mkdir my-app && cd my-app

# 2. Initialize NPM
npm init -y

# 3. Install dependencies
npm install -D typescript @types/node ts-node nodemon

# 4. Create TypeScript config
npx tsc --init

# 5. Create src folder and index file
mkdir src && touch src/index.ts

# 6. Add scripts to package.json
# "dev": "nodemon --exec ts-node src/index.ts"
# "build": "tsc"
# "start": "node dist/index.js"

# 7. Start coding!
npm run dev
```

---

**Resources:**
- [Node.js Official Docs](https://nodejs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [NPM Documentation](https://docs.npmjs.com/)

Happy Coding! 🚀
