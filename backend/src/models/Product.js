import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, required: true },
    images: { type: [String], default: [] },
    stock: { type: Number, required: true, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    category: { type: String, required: true, trim: true, index: true },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
