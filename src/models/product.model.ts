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
    default: [],
  },
});

export const Product = mongoose.model<IProduct>("products", productSchema);
