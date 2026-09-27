import mongoose from "mongoose";
import { Review } from "../models/Review.js";
import { Product } from "../models/Product.js";
import { AppError } from "../utils/errors.js";

async function refreshProductRating(productId) {
  const stats = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: null,
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);
  const ratingAvg = stats[0] ? Math.round(stats[0].avg * 10) / 10 : 0;
  const ratingCount = stats[0]?.count ?? 0;
  await Product.findByIdAndUpdate(productId, { ratingAvg, ratingCount });
  return { ratingAvg, ratingCount };
}

export async function listReviews(productId) {
  if (!mongoose.isValidObjectId(productId)) {
    throw new AppError("Invalid product id", 400);
  }
  const reviews = await Review.find({ product: productId })
    .populate("user", "email")
    .sort({ createdAt: -1 })
    .lean();
  return reviews.map((r) => ({
    id: r._id.toString(),
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    userEmail: r.user?.email?.replace(/(.{2}).*(@.*)/, "$1***$2") || "User",
  }));
}

export async function createReview(userId, productId, rating, comment) {
  if (!mongoose.isValidObjectId(productId)) {
    throw new AppError("Invalid product id", 400);
  }
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  try {
    await Review.create({
      product: productId,
      user: userId,
      rating,
      comment: comment.trim(),
    });
  } catch (e) {
    if (e.code === 11000) {
      throw new AppError("You already reviewed this product", 409);
    }
    throw e;
  }
  const ratings = await refreshProductRating(productId);
  return ratings;
}
