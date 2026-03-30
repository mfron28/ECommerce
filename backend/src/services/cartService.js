import mongoose from "mongoose";
import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";
import { AppError } from "../utils/errors.js";

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
}

export async function getCartWithTotals(userId) {
  const cart = await getOrCreateCart(userId);
  await cart.populate("items.product");
  let subtotal = 0;
  const lines = [];
  for (const line of cart.items) {
    const p = line.product;
    if (!p) continue;
    const lineTotal = p.price * line.quantity;
    subtotal += lineTotal;
    lines.push({
      productId: p._id.toString(),
      name: p.name,
      price: p.price,
      image: p.image,
      stock: p.stock,
      category: p.category,
      quantity: line.quantity,
      lineTotal,
      outOfStock: p.stock < line.quantity,
    });
  }
  return { cartId: cart._id, items: lines, total: subtotal };
}

export async function addToCart(userId, productId, quantity) {
  if (!mongoose.isValidObjectId(productId)) {
    throw new AppError("Invalid product id", 400);
  }
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  if (product.stock < 1) {
    throw new AppError("Product out of stock", 400);
  }
  if (quantity > product.stock) {
    throw new AppError("Not enough stock available", 400);
  }
  const cart = await getOrCreateCart(userId);
  const idx = cart.items.findIndex(
    (i) => i.product.toString() === productId
  );
  if (idx >= 0) {
    const nextQty = cart.items[idx].quantity + quantity;
    if (nextQty > product.stock) {
      throw new AppError("Not enough stock available", 400);
    }
    cart.items[idx].quantity = nextQty;
  } else {
    cart.items.push({ product: productId, quantity });
  }
  await cart.save();
  return getCartWithTotals(userId);
}

export async function updateCartLine(userId, productId, quantity) {
  if (!mongoose.isValidObjectId(productId)) {
    throw new AppError("Invalid product id", 400);
  }
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  if (quantity > product.stock) {
    throw new AppError("Not enough stock available", 400);
  }
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }
  const idx = cart.items.findIndex(
    (i) => i.product.toString() === productId
  );
  if (idx < 0) {
    throw new AppError("Item not in cart", 404);
  }
  cart.items[idx].quantity = quantity;
  await cart.save();
  return getCartWithTotals(userId);
}

export async function removeCartLine(userId, productId) {
  if (!mongoose.isValidObjectId(productId)) {
    throw new AppError("Invalid product id", 400);
  }
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }
  const before = cart.items.length;
  cart.items = cart.items.filter(
    (i) => i.product.toString() !== productId
  );
  if (cart.items.length === before) {
    throw new AppError("Item not in cart", 404);
  }
  await cart.save();
  return getCartWithTotals(userId);
}

export async function clearCart(userId) {
  await Cart.findOneAndUpdate({ user: userId }, { items: [] });
}
