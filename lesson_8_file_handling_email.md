# Lesson 8: File Handling & Email Notifications

## Table of Contents
1. [File Handling with Multer](#file-handling-with-multer)
2. [Email Notifications with Nodemailer](#email-notifications-with-nodemailer)
3. [Practical Implementation](#practical-implementation)
4. [Best Practices](#best-practices)
5. [Troubleshooting](#troubleshooting)

---

## Part 1: File Handling with Multer

### Introduction

**What is File Handling?**
File handling means allowing users to upload files (images, documents, etc.) to your server.

**Think of it like:**
- Email attachments - you attach files to emails
- Social media - you upload photos to Instagram/Facebook
- File sharing - you upload files to Google Drive

**Multer** is a Node.js tool that helps handle file uploads easily.

**Common Use Cases:**
- 📸 Profile picture uploads (like Facebook profile pics)
- 🛍️ Product image uploads (like Amazon product photos)
- 📄 Document uploads (PDF, Word files)
- 📊 CSV file imports (Excel-like data)
- 🖼️ Multiple file uploads (photo galleries)

**Why do we need Multer?**
- Regular Express.js can't handle file uploads by itself
- Multer acts like a "file receiver" for your server
- It processes files and saves them safely

---

### Installation

**Step 1: Install the packages**
```bash
npm install multer
npm install -D @types/multer
```

**What these packages do:**
- `multer`: The main file upload handler
- `@types/multer`: TypeScript definitions (helps with autocomplete)

---

### Basic File Upload Setup

**Think of this like setting up a filing cabinet:**
- Where to store files (destination)
- How to name files (filename)
- What types of files to accept (filter)
- How big files can be (limits)

#### 1. Create Upload Configuration

```typescript
// src/config/multer.config.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Step 1: Create uploads folder if it doesn't exist
// Like creating a folder on your computer
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Step 2: Configure where and how to store files
const storage = multer.diskStorage({
  // WHERE to save files (like choosing a folder)
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Save in 'uploads' folder
  },
  
  // HOW to name files (like renaming a file)
  filename: (req, file, cb) => {
    // Create unique filename to avoid conflicts
    // Example: "photo-1640995200000-123456789.jpg"
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname); // Get file extension (.jpg, .png)
    const name = path.basename(file.originalname, ext); // Get filename without extension
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// Step 3: Set rules for what files are allowed
// Like a bouncer at a club - only certain files get in!
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // List of allowed file types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  
  // Check file extension (like .jpg, .png)
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  // Check MIME type (the file's actual type)
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true); // ✅ File is allowed
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, PDF, DOC, DOCX are allowed.'));
  }
};

// Step 4: Create the multer instance with all our rules
export const upload = multer({
  storage: storage,           // Where and how to store
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit (5 × 1024 × 1024 bytes)
  },
  fileFilter: fileFilter      // What files are allowed
});
```

**Breaking down the code:**

**1. Destination Function:**
```typescript
destination: (req, file, cb) => {
  cb(null, uploadDir); // cb = callback, null = no error, uploadDir = folder path
}
```
- `req`: The HTTP request (contains user info, etc.)
- `file`: The uploaded file information
- `cb`: Callback function to return result
- `cb(null, uploadDir)`: "No error, save to uploads folder"

**2. Filename Function:**
```typescript
filename: (req, file, cb) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  // Date.now() = current timestamp (1640995200000)
  // Math.round(Math.random() * 1E9) = random number (123456789)
  // Result: "1640995200000-123456789"
}
```

**3. File Size Limit:**
```typescript
fileSize: 5 * 1024 * 1024
// 1024 bytes = 1 KB
// 1024 KB = 1 MB
// 5 MB = 5 × 1024 × 1024 = 5,242,880 bytes
```

---

### Image Upload Examples

**How file upload works:**
```
User selects file → Browser sends file → Multer processes → File saved → Response sent
```

#### Single File Upload

**Step 1: Create the route**
```typescript
// src/routes/upload.ts
import { Router } from 'express';
import { upload } from '../config/multer.config'; // Our multer config
import { uploadSingleFile } from '../controllers/upload.controller';
import authenticate from '../middlewares/authenticate';

const router = Router();

// Route for single file upload
// upload.single('image') means: expect ONE file with field name 'image'
router.post('/single', authenticate, upload.single('image'), uploadSingleFile);

export default router;
```

**What `upload.single('image')` does:**
- Looks for a file field named 'image' in the form
- Processes only ONE file
- Saves it using our multer configuration
- Adds file info to `req.file`

**Step 2: Create the controller**
```typescript
// src/controllers/upload.controller.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authenticate';

export const uploadSingleFile = (req: AuthRequest, res: Response) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded' // User forgot to select a file
      });
    }

    // File information (automatically provided by multer)
    const fileInfo = {
      filename: req.file.filename,        // New filename: "photo-1640995200000-123456789.jpg"
      originalName: req.file.originalname, // Original name: "my-photo.jpg"
      mimetype: req.file.mimetype,        // File type: "image/jpeg"
      size: req.file.size,                // File size in bytes: 1048576
      path: req.file.path,                // Full path: "uploads/photo-1640995200000-123456789.jpg"
      url: `/uploads/${req.file.filename}` // Public URL to access file
    };

    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      file: fileInfo
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: error.message
    });
  }
};
```

**Understanding `req.file` object:**
When multer processes a file, it adds a `file` object to the request:
```typescript
req.file = {
  fieldname: 'image',                    // Form field name
  originalname: 'my-photo.jpg',          // Original filename
  encoding: '7bit',                      // File encoding
  mimetype: 'image/jpeg',                // File type
  destination: 'uploads/',               // Where it's saved
  filename: 'photo-1640995200000-123456789.jpg', // New filename
  path: 'uploads/photo-1640995200000-123456789.jpg', // Full path
  size: 1048576                          // Size in bytes (1MB)
}
```

#### Multiple Files Upload

**For uploading several files at once (like a photo gallery)**

```typescript
// src/routes/upload.ts
// upload.array('images', 5) means: expect MULTIPLE files, max 5, field name 'images'
router.post('/multiple', authenticate, upload.array('images', 5), uploadMultipleFiles);
```

**What `upload.array('images', 5)` does:**
- Looks for files with field name 'images'
- Accepts up to 5 files maximum
- Processes all files and saves them
- Adds files info to `req.files` (note: files, not file)

```typescript
// src/controllers/upload.controller.ts
export const uploadMultipleFiles = (req: AuthRequest, res: Response) => {
  try {
    // Check if files were uploaded
    // req.files is an array when using upload.array()
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Process each file and create info object
    // .map() creates a new array by transforming each file
    const filesInfo = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`
    }));

    return res.status(200).json({
      success: true,
      message: `${req.files.length} files uploaded successfully`,
      files: filesInfo // Array of file information
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Files upload failed',
      error: error.message
    });
  }
};
```

**Understanding `req.files` array:**
When uploading multiple files, `req.files` becomes an array:
```typescript
req.files = [
  {
    fieldname: 'images',
    originalname: 'photo1.jpg',
    filename: 'photo1-1640995200000-123456789.jpg',
    // ... other properties
  },
  {
    fieldname: 'images',
    originalname: 'photo2.jpg', 
    filename: 'photo2-1640995200000-987654321.jpg',
    // ... other properties
  }
  // ... more files
]
```

**The `.map()` method explained:**
```typescript
// .map() transforms each item in an array
const numbers = [1, 2, 3];
const doubled = numbers.map(num => num * 2); // [2, 4, 6]

// In our case:
const filesInfo = req.files.map(file => ({
  filename: file.filename,
  // ... other properties
}));
// This creates a new array with only the info we want to send back
```
---
### Serve Static Files

```typescript
// src/app.ts
import express from 'express';
import path from 'path';

const app = express();

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
```

---

### Product with Image Upload

```typescript
// src/models/product.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  price: number;
  description?: string;
  category: string;
  inStock: boolean;
  quantity: number;
  images: string[]; // Array of image URLs
}

const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
  },
  description: {
    type: String,
  },
  category: {
    type: String,
    required: [true, "Category is required"],
  },
  inStock: {
    type: Boolean,
    default: true,
  },
  quantity: {
    type: Number,
    default: 1,
  },
  images: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

export const Product = mongoose.model<IProduct>("products", productSchema);
```

```typescript
// src/controllers/product.controller.ts
import { Request, Response } from "express";
import { Product } from "../models/product.model";

export const createProductWithImages = async (req: Request, res: Response) => {
  try {
    const { name, price, description, category, quantity } = req.body;

    // Get uploaded image URLs
    const images = req.files && Array.isArray(req.files)
      ? req.files.map(file => `/uploads/${file.filename}`)
      : [];

    const newProduct = await Product.create({
      name,
      price,
      description,
      category,
      quantity,
      images,
      inStock: true,
    });

    res.status(201).json({
      success: true,
      data: newProduct,
      message: "Product created successfully with images",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message
    });
  }
};
```

```typescript
// src/routes/products.ts
import { Router } from "express";
import { createProductWithImages } from "../controllers/product.controller";
import { upload } from "../config/multer.config";
import authenticate from "../middlewares/authenticate";

const router = Router();

router.post(
  "/", 
  authenticate, 
  upload.array('images', 5), 
  createProductWithImages
);

export default router;
```

---

### Delete File Helper

```typescript
// src/utils/file.helper.ts
import fs from 'fs';
import path from 'path';

export const deleteFile = (filePath: string): void => {
  const fullPath = path.join(__dirname, '../../', filePath);
  
  if (fs.existsExists(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log(`✅ File deleted: ${filePath}`);
  }
};

export const deleteMultipleFiles = (filePaths: string[]): void => {
  filePaths.forEach(filePath => {
    deleteFile(filePath);
  });
};
```

---

## Cloud Storage with Cloudinary

### What is Cloudinary?

**Cloudinary** is a cloud-based image and video management service that provides:
- Image/video upload and storage
- Automatic optimization and transformation
- CDN delivery for fast loading
- Advanced image processing

**Why use Cloudinary instead of local storage?**

**Local Storage Problems:**
- Files stored on your server take up disk space
- Server crashes = lost files
- Slow loading (no CDN)
- No automatic optimization
- Hard to scale

**Cloudinary Benefits:**
- ✅ Unlimited storage
- ✅ Automatic image optimization
- ✅ Global CDN (fast worldwide)
- ✅ Image transformations (resize, crop, filters)
- ✅ Free tier available
- ✅ Backup and reliability

### Cloudinary Setup

#### 1. Create Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for free account
3. Get your credentials from dashboard:
   - Cloud Name
   - API Key
   - API Secret

#### 2. Install Cloudinary SDK

```bash
npm install cloudinary multer-storage-cloudinary
npm install -D @types/cloudinary
```

#### 3. Configure Cloudinary

```typescript
// src/config/cloudinary.config.ts
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
```

#### 4. Update .env File

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Cloudinary Upload Configuration

```typescript
// src/config/multer-cloudinary.config.ts
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.config';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [
      {
        width: 800,
        height: 800,
        crop: 'limit',
        quality: 'auto',
        fetch_format: 'auto'
      }
    ]
  } as any
});

export const uploadToCloudinary = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed!'));
    }
  }
});
```

### Cloudinary Upload Controller

```typescript
// src/controllers/cloudinary-upload.controller.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authenticate';
import cloudinary from '../config/cloudinary.config';

export const uploadSingleImageToCloudinary = (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded'
      });
    }

    const imageInfo = {
      public_id: (req.file as any).public_id,
      url: (req.file as any).path,
      secure_url: (req.file as any).secure_url,
      width: (req.file as any).width,
      height: (req.file as any).height,
      format: (req.file as any).format,
      size: req.file.size,
      originalName: req.file.originalname
    };

    return res.status(200).json({
      success: true,
      message: 'Image uploaded to Cloudinary successfully',
      image: imageInfo
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Image upload failed',
      error: error.message
    });
  }
};

export const deleteImageFromCloudinary = async (req: Request, res: Response) => {
  try {
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }

    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result === 'ok') {
      return res.status(200).json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete image'
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Delete operation failed',
      error: error.message
    });
  }
};
```

### Product with Cloudinary Images

```typescript
// Updated product controller for Cloudinary
export const createProductWithCloudinaryImages = async (req: Request, res: Response) => {
  try {
    const { name, price, description, category, quantity } = req.body;

    // Get Cloudinary URLs from uploaded files
    const images = req.files && Array.isArray(req.files)
      ? req.files.map(file => (file as any).path) // Cloudinary URL
      : [];

    const newProduct = await Product.create({
      name,
      price,
      description,
      category,
      quantity,
      images, // Store Cloudinary URLs
      inStock: true,
    });

    res.status(201).json({
      success: true,
      data: newProduct,
      message: "Product created with Cloudinary images",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message
    });
  }
};
```

### Testing Cloudinary Upload

**Using Postman:**
1. Method: POST
2. URL: `http://localhost:8080/api/v1/upload/cloudinary/single`
3. Headers: `Authorization: Bearer YOUR_TOKEN`
4. Body: form-data
   - Key: `image` (File)
   - Value: Select image file

**Cloudinary vs Local Storage:**

| Feature | Local Storage | Cloudinary |
|---------|---------------|------------|
| Setup | Simple | Requires account |
| Speed | Server dependent | Global CDN |
| Optimization | Manual | Automatic |
| Backup | Manual | Automatic |
| Scalability | Limited | Unlimited |

**Recommendation:** Use Cloudinary for production!

---

## Part 2: Email Notifications with Nodemailer

### Introduction

**Nodemailer** is a module for Node.js to send emails easily.

**Common Use Cases:**
- Welcome emails after registration
- Password reset emails
- Order confirmation emails
- Email verification
- Notifications

---

### Installation

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

---

### Email Configuration

#### 1. Setup Email Service

```typescript
// src/config/email.config.ts
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASSWORD, // Your email password or app password
  },
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});
```

#### 2. Update .env File

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourapp.com
```

**Note for Gmail:**
- Enable 2-Factor Authentication
- Generate App Password: Google Account → Security → App Passwords
- Use the generated password in `EMAIL_PASSWORD`

---

### Email Templates

```typescript
// src/templates/email.templates.ts

export const welcomeEmailTemplate = (firstName: string, email: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { 
          display: inline-block; 
          padding: 10px 20px; 
          background: #4CAF50; 
          color: white; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0;
        }
        .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Our Platform!</h1>
        </div>
        <div class="content">
          <h2>Hello ${firstName}!</h2>
          <p>Thank you for registering with us. We're excited to have you on board.</p>
          <p>Your account has been successfully created with the email: <strong>${email}</strong></p>
          <p>You can now start exploring our platform and enjoy all the features we offer.</p>
          <a href="https://yourapp.com/login" class="button">Get Started</a>
        </div>
        <div class="footer">
          <p>© 2024 Your Company. All rights reserved.</p>
          <p>If you didn't create this account, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const passwordResetTemplate = (firstName: string, resetToken: string) => {
  const resetUrl = `https://yourapp.com/reset-password?token=${resetToken}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FF5722; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { 
          display: inline-block; 
          padding: 10px 20px; 
          background: #FF5722; 
          color: white; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0;
        }
        .warning { background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hello ${firstName}!</h2>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <p>This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        </div>
        <div class="footer">
          <p>© 2024 Your Company. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const orderConfirmationTemplate = (firstName: string, orderId: string, total: number) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .order-details { background: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Order Confirmed!</h1>
        </div>
        <div class="content">
          <h2>Thank you, ${firstName}!</h2>
          <p>Your order has been successfully placed and is being processed.</p>
          <div class="order-details">
            <h3>Order Details:</h3>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Total Amount:</strong> $${total.toFixed(2)}</p>
            <p><strong>Status:</strong> Processing</p>
          </div>
          <p>We'll send you another email when your order ships.</p>
        </div>
        <div class="footer">
          <p>© 2024 Your Company. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
```

---

### Email Service

```typescript
// src/services/email.service.ts
import { transporter } from '../config/email.config';
import { 
  welcomeEmailTemplate, 
  passwordResetTemplate,
  orderConfirmationTemplate 
} from '../templates/email.templates';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const mailOptions = {
      from: `"Your App" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw new Error('Failed to send email');
  }
};

export const sendWelcomeEmail = async (
  email: string, 
  firstName: string
): Promise<void> => {
  await sendEmail({
    to: email,
    subject: 'Welcome to Our Platform! 🎉',
    html: welcomeEmailTemplate(firstName, email),
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  firstName: string,
  resetToken: string
): Promise<void> => {
  await sendEmail({
    to: email,
    subject: 'Password Reset Request 🔐',
    html: passwordResetTemplate(firstName, resetToken),
  });
};

export const sendOrderConfirmationEmail = async (
  email: string,
  firstName: string,
  orderId: string,
  total: number
): Promise<void> => {
  await sendEmail({
    to: email,
    subject: `Order Confirmation - ${orderId} ✅`,
    html: orderConfirmationTemplate(firstName, orderId, total),
  });
};
```

---

## Part 3: Practical Implementation

### Send Welcome Email on Registration

```typescript
// src/controllers/auth.controller.ts
import { sendWelcomeEmail } from '../services/email.service';

export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        status: "fail",
        message: "User with this email already exists"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    // Generate token
    const token = await signToken({
      id: newUser.id,
      email: newUser.email,
    });

    // Send welcome email (async, don't wait)
    sendWelcomeEmail(email, firstName).catch(err => {
      console.error('Failed to send welcome email:', err);
      // Don't fail registration if email fails
    });

    // Remove password from response
    const { password: _, ...userResponse } = newUser.toObject();

    return res.status(201).json({
      status: "success",
      message: "User registered successfully. Check your email!",
      user: userResponse,
      token,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "fail",
      message: "Registration failed",
      error: error.message
    });
  }
};
```

---

### Password Reset Flow

```typescript
// src/models/user.model.ts
const UserSchema = new Schema<IUser>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
}, {
  timestamps: true
});
```

```typescript
// src/controllers/auth.controller.ts
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../services/email.service';

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "No user found with that email"
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Save token to user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Send email
    await sendPasswordResetEmail(email, user.firstName, resetToken);

    return res.status(200).json({
      status: "success",
      message: "Password reset email sent. Check your inbox!"
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "fail",
      message: "Failed to send reset email",
      error: error.message
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    // Hash the token from URL
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid or expired reset token"
      });
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Password reset successful. You can now login."
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "fail",
      message: "Password reset failed",
      error: error.message
    });
  }
};
```

```typescript
// src/routes/auth.ts
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
```

---

## Best Practices

### File Upload Best Practices

1. **Always Validate File Types**
```typescript
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};
```

2. **Set File Size Limits**
```typescript
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5 // Max 5 files
  }
});
```

3. **Use Unique Filenames**
```typescript
filename: (req, file, cb) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
}
```

4. **Clean Up Old Files**
```typescript
// Delete old product images when updating
if (product.images.length > 0) {
  deleteMultipleFiles(product.images);
}
```

5. **Use Cloud Storage for Production**
- AWS S3
- Cloudinary
- Google Cloud Storage

---

### Email Best Practices

1. **Don't Block Registration**
```typescript
// Send email asynchronously
sendWelcomeEmail(email, firstName).catch(err => {
  console.error('Email failed:', err);
  // Log but don't fail the request
});
```

2. **Use Email Queue for High Volume**
```bash
npm install bull redis
```

3. **HTML Email Templates**
- Use inline CSS
- Test on multiple email clients
- Include plain text fallback

4. **Security**
- Use app passwords, not account passwords
- Store credentials in environment variables
- Validate email addresses before sending

5. **Rate Limiting**
```typescript
// Limit password reset requests
const resetAttempts = await RedisClient.get(`reset:${email}`);
if (resetAttempts && parseInt(resetAttempts) > 3) {
  return res.status(429).json({
    message: 'Too many reset attempts. Try again later.'
  });
}
```

---

## Troubleshooting

### File Upload Issues

**Error: "Unexpected field"**
```typescript
// Make sure field name matches
upload.single('image') // Field name must be 'image'
```

**Error: "File too large"**
```typescript
// Increase limit
limits: { fileSize: 10 * 1024 * 1024 } // 10MB
```

**Files not accessible**
```typescript
// Serve static files
app.use('/uploads', express.static('uploads'));
```

---

### Email Issues

**Error: "Invalid login"**
- Use app password for Gmail
- Enable "Less secure app access" (not recommended)
- Check EMAIL_USER and EMAIL_PASSWORD

**Emails going to spam**
- Use verified domain
- Add SPF and DKIM records
- Use professional email service (SendGrid, Mailgun)

**Emails not sending**
```typescript
// Test connection
transporter.verify((error, success) => {
  if (error) {
    console.log(error);
  } else {
    console.log('Server is ready to send emails');
  }
});
```

---

## Complete Example: Product with Image & Email

```typescript
// src/routes/products.ts
import { Router } from "express";
import { upload } from "../config/multer.config";
import { createProductWithNotification } from "../controllers/product.controller";
import authenticate from "../middlewares/authenticate";

const router = Router();

router.post(
  "/",
  authenticate,
  upload.array('images', 5),
  createProductWithNotification
);

export default router;
```

```typescript
// src/controllers/product.controller.ts
import { Product } from "../models/product.model";
import { AuthRequest } from "../middlewares/authenticate";
import { sendEmail } from "../services/email.service";

export const createProductWithNotification = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { name, price, description, category, quantity } = req.body;

    // Get uploaded images
    const images = req.files && Array.isArray(req.files)
      ? req.files.map(file => `/uploads/${file.filename}`)
      : [];

    // Create product
    const newProduct = await Product.create({
      name,
      price,
      description,
      category,
      quantity,
      images,
      inStock: true,
    });

    // Send notification email to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@yourapp.com';
    sendEmail({
      to: adminEmail,
      subject: 'New Product Added',
      html: `
        <h2>New Product: ${name}</h2>
        <p>Price: $${price}</p>
        <p>Category: ${category}</p>
        <p>Images: ${images.length}</p>
      `
    }).catch(err => console.error('Failed to send notification:', err));

    res.status(201).json({
      success: true,
      data: newProduct,
      message: "Product created successfully with images",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message
    });
  }
};
```

---

## Testing with Postman

### File Upload Test

1. **Create POST request**: `http://localhost:8080/api/v1/products`
2. **Headers**: 
   - `Authorization: Bearer YOUR_TOKEN`
3. **Body** → Select `form-data`:
   - Key: `name` → Value: `Laptop`
   - Key: `price` → Value: `999`
   - Key: `category` → Value: `Electronics`
   - Key: `images` → Type: `File` → Select multiple files
4. **Send**

---

## Summary

### File Handling
- ✅ Use Multer for file uploads
- ✅ Validate file types and sizes
- ✅ Generate unique filenames
- ✅ Serve static files with Express
- ✅ Clean up old files when updating

### Email Notifications
- ✅ Use Nodemailer for sending emails
- ✅ Create HTML email templates
- ✅ Send welcome emails on registration
- ✅ Implement password reset flow
- ✅ Don't block requests waiting for emails

---

## Next Steps

- [ ] Implement file upload in your project
- [ ] Set up email service
- [ ] Create email templates
- [ ] Test file uploads with Postman
- [ ] Send welcome emails on registration
- [ ] Implement password reset feature

---

**Resources:**
- [Multer Documentation](https://github.com/expressjs/multer)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Email Template Best Practices](https://www.campaignmonitor.com/dev-resources/)

Happy Coding! 🚀
