import mongoose from "mongoose";
import { Wishlist } from "../models/Wishlist.js";
import { Product } from "../models/Product.js";
import { AppError } from "../utils/errors.js";
import { productDto } from "../utils/productDto.js";

async function getOrCreate(userId) {
  let list = await Wishlist.findOne({ user: userId });
  if (!list) {
    list = await Wishlist.create({ user: userId, products: [] });
  }
  return list;
}

export async function getWishlist(userId) {
  const list = await getOrCreate(userId);
  await list.populate("products");
  const products = (list.products || [])
    .filter(Boolean)
    .map((p) => productDto(p));
  return { productIds: products.map((p) => p.id), products };
}

export async function addToWishlist(userId, productId) {
  if (!mongoose.isValidObjectId(productId)) {
    throw new AppError("Invalid product id", 400);
  }
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  const list = await getOrCreate(userId);
  const idStr = productId.toString();
  if (!list.products.some((p) => p.toString() === idStr)) {
    list.products.push(productId);
    await list.save();
  }
  return getWishlist(userId);
}

export async function removeFromWishlist(userId, productId) {
  if (!mongoose.isValidObjectId(productId)) {
    throw new AppError("Invalid product id", 400);
  }
  const list = await getOrCreate(userId);
  list.products = list.products.filter((p) => p.toString() !== productId);
  await list.save();
  return getWishlist(userId);
}

export async function isInWishlist(userId, productId) {
  const list = await Wishlist.findOne({ user: userId }).lean();
  if (!list) return false;
  return list.products.some((p) => p.toString() === productId);
}
