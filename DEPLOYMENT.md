# Deployment Guide - Render

## Prerequisites
- GitHub account
- Render account (free tier available)
- MongoDB Atlas account (for production database)

---

## Step 1: Prepare Your Code

### 1.1 Build Your Project Locally
```bash
npm run build
```

This creates a `dist/` folder with compiled JavaScript.

### 1.2 Test Production Build
```bash
npm start
```

Make sure your app runs correctly with the built files.

---

## Step 2: Set Up MongoDB Atlas (Production Database)

### 2.1 Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free tier
3. Create a new cluster

### 2.2 Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database password

Example:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ecommerce_db?retryWrites=true&w=majority
```

---

## Step 3: Push to GitHub

### 3.1 Initialize Git (if not already done)
```bash
git init
git add .
git commit -m "Initial commit"
```

### 3.2 Create GitHub Repository
1. Go to https://github.com/new
2. Create a new repository
3. Don't initialize with README (you already have code)

### 3.3 Push Your Code
```bash
git remote add origin https://github.com/yourusername/your-repo.git
git branch -M main
git push -u origin main
```

---

## Step 4: Deploy to Render

### 4.1 Create Render Account
1. Go to https://render.com
2. Sign up with GitHub

### 4.2 Create New Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure the service:

**Basic Settings:**
- **Name**: `your-app-name`
- **Region**: Choose closest to you
- **Branch**: `main`
- **Root Directory**: Leave empty
- **Runtime**: `Node`

**Build & Deploy:**
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 4.3 Add Environment Variables
Click "Environment" tab and add:

```
PORT=8080
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ecommerce_db
JWT_SECRET=your-super-secret-production-key-min-32-chars
EXPIRATION_TOKEN=7d
SALT_ROUNDS=12
NODE_ENV=production
```

**Important:**
- Use your MongoDB Atlas connection string
- Generate a strong JWT_SECRET (32+ characters)
- Never use development secrets in production

### 4.4 Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Your app will be live at: `https://your-app-name.onrender.com`

---

## Step 5: Test Your Deployment

### 5.1 Access Swagger Documentation
```
https://your-app-name.onrender.com/api-docs
```

### 5.2 Test Endpoints
```bash
# Register a user
curl -X POST https://your-app-name.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123"
  }'

# Login
curl -X POST https://your-app-name.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

---

## Troubleshooting

### Build Fails
**Error**: `Cannot find module`
**Solution**: Make sure all dependencies are in `dependencies`, not `devDependencies`

```bash
# Move TypeScript to dependencies for Render
npm install --save typescript ts-node
```

### App Crashes on Start
**Error**: `MODULE_NOT_FOUND`
**Solution**: Check your start command uses `dist/server.js`, not `src/server.ts`

### Database Connection Fails
**Error**: `MongoServerError: Authentication failed`
**Solution**: 
1. Check MongoDB Atlas connection string
2. Verify database user password
3. Whitelist Render's IP (or use 0.0.0.0/0 for all IPs)

### Environment Variables Not Working
**Solution**: 
1. Go to Render dashboard
2. Click your service → Environment
3. Add all required variables
4. Click "Save Changes"
5. Redeploy if needed

---

## Continuous Deployment

Render automatically redeploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main
```

Render will automatically:
1. Pull latest code
2. Run build command
3. Deploy new version

---

## Monitoring

### View Logs
1. Go to Render dashboard
2. Click your service
3. Click "Logs" tab
4. See real-time logs

### Check Health
```bash
curl https://your-app-name.onrender.com/
```

---

## Production Checklist

- ✅ MongoDB Atlas configured
- ✅ Strong JWT_SECRET (32+ characters)
- ✅ Environment variables set
- ✅ .env file in .gitignore
- ✅ Build command works locally
- ✅ Start command tested
- ✅ HTTPS enabled (automatic on Render)
- ✅ CORS configured if needed
- ✅ Error handling in place
- ✅ Swagger docs accessible

---

## Free Tier Limitations

**Render Free Tier:**
- App sleeps after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds
- 750 hours/month free

**MongoDB Atlas Free Tier:**
- 512 MB storage
- Shared cluster
- Perfect for development/testing

**Upgrade When:**
- Need 24/7 uptime
- High traffic expected
- More storage needed

---

## Your Deployed URLs

```
API Base URL: https://your-app-name.onrender.com
Swagger Docs: https://your-app-name.onrender.com/api-docs
Health Check: https://your-app-name.onrender.com/

Endpoints:
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- GET  /api/v1/auth/profile
- GET  /api/v1/products
- POST /api/v1/products
- PUT  /api/v1/products/:id
- DELETE /api/v1/products/:id
```

---

## Next Steps

1. **Custom Domain**: Add your own domain in Render settings
2. **Monitoring**: Set up error tracking (Sentry, LogRocket)
3. **Analytics**: Add API analytics
4. **Rate Limiting**: Implement rate limiting for production
5. **Caching**: Add Redis for better performance

Your Node.js API is now live and production-ready! 🚀
