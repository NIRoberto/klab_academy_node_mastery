import { Request, Response } from "express";
import { Product } from "../models/product.model";

// GET /products - Get all products
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find();

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.log(error);
  }
};

// GET /products/:id - Get single product
export const getProductById = async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        status: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.log(error);
  }
};

// POST /products - Create new product
export const createProduct = async (req: Request, res: Response) => {
  try {
    /*
      name: string;
  price: number;
  description?: string;
  category: string;
  inStock: boolean;
  quantity: number;

  */

    const { name, price, description, category, quantity } = req.body;

    const newProduct = await Product.create({
      name,
      price,
      description,
      category,
      quantity,
      inStock: true,
    });

    res.status(201).json({
      success: true,
      data: newProduct,
      message: "Product created successfully",
    });
  } catch (error) {
    console.log(error);
  }
};

// PUT /products/:id - Update product
export const updateProduct = (req: Request, res: Response) => {
  // const id = parseInt(req.params.id || "");
  // const productIndex = products.findIndex((p) => p.id === id);

  // if (productIndex === -1) {
  //   return res.status(404).json({ error: "Product not found" });
  // }

  // // Update product
  // products[productIndex] = { ...products[productIndex], ...req.body, id };

  res.status(200).json({
    success: true,
    // data: products[productIndex],
    message: "Product updated successfully",
  });
};

// DELETE /products/:id - Delete product
export const deleteProduct = async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        status: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.log(error);
  }
};
