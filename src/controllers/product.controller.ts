import { Request, Response } from "express";
import { Product } from "../models/product.model";
import cloudinary from "../config/cloudinary.config";

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of all products
 */
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find();

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve products",
      error: error.message
    });
  }
};

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
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product found
 *       404:
 *         description: Product not found
 */
export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve product",
      error: error.message
    });
  }
};

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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - category
 *               - quantity
 *             properties:
 *               name:
 *                 type: string
 *                 example: iPhone 15
 *               price:
 *                 type: number
 *                 example: 999.99
 *               description:
 *                 type: string
 *                 example: Latest iPhone model
 *               category:
 *                 type: string
 *                 example: Electronics
 *               quantity:
 *                 type: number
 *                 example: 50
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Upload one or multiple product images
 *     responses:
 *       201:
 *         description: Product created successfully
 *       401:
 *         description: Unauthorized
 */
export const createProduct = async (req: Request, res: Response) => {
  try {
    // Extract product data from request body
    const { name, price, description, category, quantity, images: bodyImages } = req.body;

    // Debug: Log incoming data for troubleshooting
    console.log('Files:', req.files);
    console.log('File:', req.file);
    console.log('Body images:', bodyImages);

    // Handle image uploads with Cloudinary cloud storage
    let images: string[] = [];
    
    if (req.files && Array.isArray(req.files)) {





      
      // Case 1: Multiple files uploaded via form-data
      // Create upload promises for all files simultaneously
      const uploadPromises = req.files.map(file => 
        cloudinary.uploader.upload(file.path, {
          folder: 'products',        // Organize images in 'products' folder
          resource_type: 'image'     // Specify this is an image upload
        })
      );
      // Wait for all uploads to complete
      const uploadResults = await Promise.all(uploadPromises);
      // Extract secure URLs from Cloudinary response
      images = uploadResults.map(result => result.secure_url);
    } else if (req.file) {
      // Case 2: Single file uploaded via form-data
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: 'products',
        resource_type: 'image'
      });
      // Store single image URL in array
      images = [uploadResult.secure_url];
    } else if (bodyImages) {
      // Case 3: Image URLs provided in request body (no file upload)
      // Convert single URL to array or use existing array
      images = Array.isArray(bodyImages) ? bodyImages : [bodyImages];
    }

    // Debug: Log final image URLs that will be saved
    console.log('Final images array:', images);

    // Create new product in MongoDB database
    const newProduct = await Product.create({
      name,
      price,
      description,
      category,
      quantity,
      images, // Store Cloudinary URLs (e.g., https://res.cloudinary.com/...)
      inStock: true,
    });

    // Clean up response: Remove MongoDB internal fields (_id, __v)
    const { _id, __v, ...productData } = newProduct.toObject();

    // Send success response with clean data
    res.status(201).json({
      success: true,
      data: { id: _id, ...productData }, // Use 'id' instead of '_id'
      message: "Product created successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message
    });
  }
};

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
 *               category:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 */
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { name, price, description, category, quantity } = req.body;

    // Find existing product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Handle new image uploads if provided
    let images = product.images; // Keep existing images by default
    
    if (req.files && Array.isArray(req.files)) {
      // Multiple new files uploaded - replace all images
      images = req.files.map(file => `/uploads/${file.filename}`);
    } else if (req.file) {
      // Single new file uploaded - replace all images
      images = [`/uploads/${req.file.filename}`];
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name: name || product.name,
        price: price || product.price,
        description: description || product.description,
        category: category || product.category,
        quantity: quantity || product.quantity,
        images
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedProduct,
      message: "Product updated successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message
    });
  }
};

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
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message
    });
  }
};
