import { Router } from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller";
import authenticate from "../middlewares/authenticate";

const router = Router();

// GET /products - Get all products
router.get("/", getAllProducts);

// GET /products/:id - Get single product
router.get("/:id", getProductById);

// POST /products - Create new product
router.post("/", authenticate, createProduct);

// PUT /products/:id - Update product
router.put("/:id", updateProduct);

// DELETE /products/:id - Delete product
router.delete("/:id", deleteProduct);

export default router;
