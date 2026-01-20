import { Router } from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller";
import authenticate from "../middlewares/authenticate";
import { upload } from "../config/multer.config";

const router = Router();

// GET /products - Get all products
router.get("/", getAllProducts);

// GET /products/:id - Get single product
router.get("/:id", getProductById);

// POST /products - Create new product with images
router.post("/", upload.array('images', 5), createProduct);

// PUT /products/:id - Update product with images
router.put("/:id", authenticate, upload.array('images', 5), updateProduct);

// DELETE /products/:id - Delete product
router.delete("/:id", deleteProduct);

export default router;
