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

**Multer** is a Node.js middleware for handling `multipart/form-data`, primarily used for uploading files.

**Common Use Cases:**
- Profile picture uploads
- Product image uploads
- Document uploads (PDF, DOCX)
- CSV file imports
- Multiple file uploads

---

### Installation

```bash
npm install multer
npm install -D @types/multer
```

---

### Basic File Upload Setup

#### 1. Create Upload Configuration

```typescript
// src/config/multer.config.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directory exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter for validation
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, PDF, DOC, DOCX are allowed.'));
  }
};

// Create multer instance
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});
```

---

### Image Upload Examples

#### Single File Upload

```typescript
// src/routes/upload.ts
import { Router } from 'express';
import { upload } from '../config/multer.config';
import { uploadSingleFile } from '../controllers/upload.controller';
import authenticate from '../middlewares/authenticate';

const router = Router();

// Single file upload
router.post('/single', authenticate, upload.single('image'), uploadSingleFile);

export default router;
```

```typescript
// src/controllers/upload.controller.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authenticate';

export const uploadSingleFile = (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // File information
    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads/${req.file.filename}` // Public URL
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

#### Multiple Files Upload

```typescript
// src/routes/upload.ts
router.post('/multiple', authenticate, upload.array('images', 5), uploadMultipleFiles);
```

```typescript
// src/controllers/upload.controller.ts
export const uploadMultipleFiles = (req: AuthRequest, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

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
      files: filesInfo
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
  
  if (fs.existsSync(fullPath)) {
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
