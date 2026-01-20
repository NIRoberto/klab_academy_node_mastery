// src/config/multer.config.ts
import multer from "multer";
import path from "path";
import fs from "fs";

// Step 1: Create uploads folder if it doesn't exist
// Like creating a folder on your computer
const uploadDir = "./uploads";

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
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname); // Get file extension (.jpg, .png)
    const name = path.basename(file.originalname, ext); // Get filename without extension
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// Step 3: Set rules for what files are allowed
// Like a bouncer at a club - only certain files get in!
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // List of allowed file types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;

  // Check file extension (like .jpg, .png)
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  // Check MIME type (the file's actual type)
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true); // File is allowed
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, GIF, PDF, DOC, DOCX are allowed."
      )
    );
  }
};

// Step 4: Create the multer instance with all our rules
export const upload = multer({
  storage: storage, // Where and how to store
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit (5 × 1024 × 1024 bytes)
  },
  fileFilter: fileFilter, // What files are allowed
});


