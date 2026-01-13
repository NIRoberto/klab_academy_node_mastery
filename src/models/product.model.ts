import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  id: number;
  name: string;
  price: number;
  description?: string;
  category: string;
  inStock: boolean;
  quantity: number;
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
});

export const Product = mongoose.model<IProduct>("products", productSchema);
