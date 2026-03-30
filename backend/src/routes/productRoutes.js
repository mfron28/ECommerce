import { Router } from "express";
import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { AppError } from "../utils/errors.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { q, category, minPrice, maxPrice } = req.query;
    const filter = {};

    if (q && String(q).trim()) {
      filter.name = { $regex: String(q).trim(), $options: "i" };
    }
    if (category && String(category).trim()) {
      filter.category = String(category).trim();
    }
    if (minPrice !== undefined && minPrice !== "") {
      const n = Number(minPrice);
      if (!Number.isFinite(n) || n < 0) {
        throw new AppError("Invalid minPrice", 400);
      }
      filter.price = { ...filter.price, $gte: n };
    }
    if (maxPrice !== undefined && maxPrice !== "") {
      const n = Number(maxPrice);
      if (!Number.isFinite(n) || n < 0) {
        throw new AppError("Invalid maxPrice", 400);
      }
      filter.price = { ...filter.price, $lte: n };
    }

    const products = await Product.find(filter).sort({ name: 1 }).lean();
    res.json({
      status: "ok",
      products: products.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        description: p.description,
        price: p.price,
        image: p.image,
        stock: p.stock,
        category: p.category,
      })),
    });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError("Invalid product id", 400);
    }
    const p = await Product.findById(id).lean();
    if (!p) {
      throw new AppError("Product not found", 404);
    }
    res.json({
      status: "ok",
      product: {
        id: p._id.toString(),
        name: p.name,
        description: p.description,
        price: p.price,
        image: p.image,
        stock: p.stock,
        category: p.category,
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
