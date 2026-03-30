import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, required: true },
    stock: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true, index: true },
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
