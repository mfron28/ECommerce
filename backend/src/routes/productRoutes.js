import { Router } from "express";
import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { AppError } from "../utils/errors.js";
import { productDto } from "../utils/productDto.js";
import { requireAuth } from "../middleware/auth.js";
import { listReviews, createReview } from "../services/reviewService.js";
import { reviewSchema } from "../validation/review.js";
import { parseBody } from "../utils/parseBody.js";
import { isInWishlist } from "../services/wishlistService.js";
import { optionalAuth } from "../middleware/optionalAuth.js";

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
      products: products.map((p) => productDto(p)),
    });
  } catch (e) {
    next(e);
  }
});

router.get("/:id/reviews", async (req, res, next) => {
  try {
    const reviews = await listReviews(req.params.id);
    res.json({ status: "ok", reviews });
  } catch (e) {
    next(e);
  }
});

router.post("/:id/reviews", requireAuth, async (req, res, next) => {
  try {
    const { rating, comment } = parseBody(reviewSchema, req.body);
    const ratings = await createReview(
      req.user._id,
      req.params.id,
      rating,
      comment
    );
    res.status(201).json({ status: "ok", ...ratings });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError("Invalid product id", 400);
    }
    const p = await Product.findById(id).lean();
    if (!p) {
      throw new AppError("Product not found", 404);
    }
    const inWishlist = req.user
      ? await isInWishlist(req.user._id, id)
      : false;
    res.json({
      status: "ok",
      product: { ...productDto(p), inWishlist },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
