# Lesson 6: Deploying Node.js API to Render

## Table of Contents
1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Package.json Configuration](#packagejson-configuration)
4. [Environment Variables](#environment-variables)
5. [Deployment Steps](#deployment-steps)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Introduction

**Render** is a modern cloud platform that makes deploying web applications simple. It automatically builds and deploys your Node.js API from GitHub with zero configuration needed.

**Why Render?**
- ✅ Free tier available
- ✅ Automatic deployments from GitHub
- ✅ Built-in SSL certificates
- ✅ Easy environment variable management
- ✅ No credit card required for free tier

---

## Prerequisites

Before deploying, ensure you have:

1. **GitHub Account** - Your code must be in a GitHub repository
2. **MongoDB Atlas Account** - Free cloud database (not localhost)
3. **Render Account** - Sign up at [render.com](https://render.com)
4. **Working Local Application** - Test locally first

---

## Package.json Configuration

### ✅ Correct package.json for Deployment

```json
{
  "name": "klab_academy_node_mastery",
  "version": "1.0.0",
  "description": "Node.js API with TypeScript and Express",
  "main": "dist/server.js",
  "type": "commonjs",
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "start:dev": "ts-node src/server.ts",
    "test": "jest"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "keywords": ["nodejs", "typescript", "express", "api"],
  "author": "Your Name",
  "license": "ISC",
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "dotenv": "^17.2.3",
    "express": "^5.2.1",
    "jsonwebtoken": "^9.0.3",
    "mongoose": "^9.1.3",
    "morgan": "^1.10.1",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.1"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/express": "^5.0.6",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/morgan": "^1.9.10",
    "@types/node": "^25.0.3",
    "@types/swagger-jsdoc": "^6.0.4",
    "@types/swagger-ui-express": "^4.1.8",
    "nodemon": "^3.1.11",
    "ts-node": "^10.9.2",
    "typescript": "^5.9.3",
    "tslib": "^2.8.1"
  }
}
```

### 🔑 Key Points

#### 1. **Scripts Section**
```json
"scripts": {
  "build": "tsc",           // Compiles TypeScript to JavaScript
  "start": "node dist/server.js"  // Runs compiled code (production)
}
```

- **build**: Must compile TypeScript to JavaScript
- **start**: Must run the compiled code from `dist/` folder
- ⚠️ **Never use** `ts-node` in production (it's slow)

#### 2. **Engines Section** (Important!)
```json
"engines": {
  "node": ">=18.0.0",
  "npm": ">=9.0.0"
}
```

- Tells Render which Node.js version to use
- Prevents version mismatch issues
- Use the same version you develop with locally

#### 3. **Main Entry Point**
```json
"main": "dist/server.js"
```

- Points to compiled JavaScript file
- Not `src/server.ts` (TypeScript source)

#### 4. **Dependencies vs DevDependencies**

**Dependencies** (needed in production):
```json
"dependencies": {
  "express": "^5.2.1",
  "mongoose": "^9.1.3",
  "bcryptjs": "^3.0.3"
}
```

**DevDependencies** (only for development):
```json
"devDependencies": {
  "@types/express": "^5.0.6",
  "typescript": "^5.9.3",
  "nodemon": "^3.1.11",
  "ts-node": "^10.9.2"
}
```

⚠️ **Important**: TypeScript and type definitions should be in `devDependencies` since you deploy compiled JavaScript.

---

## Environment Variables

### Local Development (.env file)
```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017/ecommerce_db
JWT_SECRET=your-super-secret-jwt-key-make-it-long-and-random
EXPIRATION_TOKEN=1d
SALT_ROUNDS=12
NODE_ENV=development
```

### Production (Render Dashboard)

**Never commit .env to GitHub!** Add to `.gitignore`:
```
.env
.env.local
.env.production
```

---

## Deployment Steps

### Step 1: Prepare MongoDB Atlas

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster (M0 Sandbox)
3. Create database user with password
4. Whitelist all IPs: `0.0.0.0/0` (for Render)
5. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
   ```

### Step 2: Push Code to GitHub

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for deployment"

# Add remote repository
git remote add origin https://github.com/yourusername/your-repo.git

# Push to GitHub
git push -u origin main
```

### Step 3: Create Render Web Service

1. **Sign up/Login** to [render.com](https://render.com)

2. **Click "New +"** → Select **"Web Service"**

3. **Connect GitHub Repository**
   - Authorize Render to access your GitHub
   - Select your repository

4. **Configure Service**
   ```
   Name: klab-node-api
   Region: Choose closest to you
   Branch: main
   Root Directory: (leave empty)
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

5. **Select Plan**
   - Choose **"Free"** plan

6. **Add Environment Variables**
   Click "Advanced" → Add Environment Variables:
   
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
   | `JWT_SECRET` | `your-super-secret-key-min-32-chars` |
   | `EXPIRATION_TOKEN` | `1d` |
   | `SALT_ROUNDS` | `12` |

   ⚠️ **Don't set PORT** - Render sets it automatically

7. **Click "Create Web Service"**

### Step 4: Monitor Deployment

Watch the build logs:
```
==> Cloning from GitHub...
==> Installing dependencies...
==> Running build command: npm install && npm run build
==> Build successful 🎉
==> Deploying...
==> Your service is live at https://your-app.onrender.com
```

---

## Best Practices

### 1. **TypeScript Configuration (tsconfig.json)**

```json
{
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "module": "commonjs",
    "target": "es2020",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 2. **Server Configuration for Production**

```typescript
// src/server.ts
import dotenv from "dotenv";
import app from "./app";
import { connectDB } from "./config/db.connect";

dotenv.config();

// Use Render's PORT or fallback to 8080
const PORT = process.env.PORT || 8080;

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error("❌ Server failed to start:", error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});
```

### 3. **Database Connection Best Practices**

```typescript
// src/config/db.connect.ts
import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || "", {
      // These options are now default in Mongoose 6+
      // No need to specify them explicitly
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection errors after initial connection
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};
```

### 4. **Environment Variable Validation**

```typescript
// src/config/env.validation.ts
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'EXPIRATION_TOKEN',
  'SALT_ROUNDS'
];

export const validateEnv = () => {
  const missing = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
};

// Use in server.ts
import { validateEnv } from './config/env.validation';
validateEnv();
```

### 5. **Security Headers**

```bash
npm install helmet cors
```

```typescript
// src/app.ts
import helmet from 'helmet';
import cors from 'cors';

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-frontend.com' 
    : 'http://localhost:3000',
  credentials: true
}));
```

### 6. **Health Check Endpoint**

```typescript
// src/app.ts
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});
```

### 7. **Logging in Production**

```typescript
// Only log errors in production
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}
```

### 8. **Git Best Practices**

**.gitignore**
```
# Dependencies
node_modules/

# Environment
.env
.env.local
.env.production

# Build output
dist/
build/

# Logs
*.log
npm-debug.log*

# IDE
.vscode/
.idea/

# OS
.DS_Store
```

---

## Troubleshooting

### ❌ Error: "Cannot find module"

**Problem**: Render can't find your compiled files

**Solution**:
1. Check `package.json` scripts:
   ```json
   "build": "tsc",
   "start": "node dist/server.js"
   ```
2. Verify `tsconfig.json` has correct `outDir`:
   ```json
   "outDir": "./dist"
   ```
3. In Render dashboard:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

---

### ❌ Error: "ECONNREFUSED MongoDB"

**Problem**: Can't connect to localhost MongoDB

**Solution**:
- Use MongoDB Atlas (cloud database)
- Update `MONGODB_URI` in Render environment variables
- Whitelist all IPs in MongoDB Atlas: `0.0.0.0/0`

---

### ❌ Error: "Port already in use"

**Problem**: Hardcoded port in code

**Solution**:
```typescript
// ❌ Wrong
const PORT = 8080;

// ✅ Correct
const PORT = process.env.PORT || 8080;
```

---

### ❌ Build succeeds but app crashes

**Problem**: Missing environment variables

**Solution**:
1. Check Render logs for error messages
2. Verify all environment variables are set in Render dashboard
3. Add validation for required env vars

---

### ❌ "Module not found" for dependencies

**Problem**: Dependencies in wrong section

**Solution**:
Move runtime dependencies from `devDependencies` to `dependencies`:
```bash
npm install express mongoose --save
npm install typescript @types/node --save-dev
```

---

## Deployment Checklist

Before deploying, verify:

- [ ] Code works locally
- [ ] `package.json` has correct scripts
- [ ] `engines` field specifies Node version
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] `.env` is in `.gitignore`
- [ ] MongoDB Atlas is set up
- [ ] All environment variables documented
- [ ] Health check endpoint exists
- [ ] Error handling is implemented
- [ ] CORS is configured
- [ ] Code is pushed to GitHub

---

## Post-Deployment

### Test Your API

```bash
# Health check
curl https://your-app.onrender.com/health

# Test endpoint
curl https://your-app.onrender.com/api/v1/products

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-app.onrender.com/api/v1/auth/profile
```

### Monitor Your App

1. **Render Dashboard** → Your Service → Logs
2. Set up alerts for errors
3. Monitor response times
4. Check database connections

### Automatic Deployments

Render automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update API"
git push origin main
# Render automatically deploys! 🚀
```

---

## Common Render Commands

### View Logs
```bash
# In Render dashboard → Logs tab
# Or use Render CLI
render logs
```

### Restart Service
```bash
# Render dashboard → Manual Deploy → Clear build cache & deploy
```

### Update Environment Variables
```bash
# Render dashboard → Environment → Add/Edit variables
# Changes require manual deploy
```

---

## Cost Optimization

### Free Tier Limitations
- ✅ 750 hours/month (enough for 1 app)
- ✅ Automatic SSL
- ⚠️ Spins down after 15 min inactivity
- ⚠️ Cold start takes 30-60 seconds

### Keep App Awake (Optional)
Use a cron job to ping your app every 10 minutes:
```bash
# Use cron-job.org or similar
GET https://your-app.onrender.com/health
```

---

## Summary

**Key Takeaways:**

1. **package.json must have**:
   - `build` script that compiles TypeScript
   - `start` script that runs compiled code
   - `engines` field with Node version

2. **Render Configuration**:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Environment Variables**:
   - Never commit `.env` to GitHub
   - Set all variables in Render dashboard
   - Use MongoDB Atlas, not localhost

4. **Best Practices**:
   - Test locally before deploying
   - Use proper error handling
   - Add health check endpoint
   - Monitor logs after deployment

---

## Next Steps

- [ ] Deploy your API to Render
- [ ] Test all endpoints in production
- [ ] Set up custom domain (optional)
- [ ] Add monitoring and alerts
- [ ] Learn about CI/CD pipelines (Lesson 7)

---

**Resources:**
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Need Help?**
- Check Render logs for errors
- Review this guide's troubleshooting section
- Ask in the kLab community

Happy Deploying! 🚀
