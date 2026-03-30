import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { getCartWithTotals, clearCart } from "./cartService.js";
import { AppError } from "../utils/errors.js";

export async function createOrderFromCart(userId) {
  const { items, total } = await getCartWithTotals(userId);
  if (!items.length) {
    throw new AppError("Cannot checkout with an empty cart", 400);
  }
  for (const line of items) {
    if (line.outOfStock) {
      throw new AppError("Product out of stock", 400);
    }
  }

  let computedTotal = 0;
  const orderLines = [];

  for (const line of items) {
    const product = await Product.findById(line.productId);
    if (!product) {
      throw new AppError("Product not found", 404);
    }
    if (product.price !== line.price) {
      throw new AppError("Price has changed — refresh your cart", 409);
    }
    if (product.stock < line.quantity) {
      throw new AppError("Not enough stock available", 400);
    }
    const lineTotal = product.price * line.quantity;
    computedTotal += lineTotal;
    orderLines.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: line.quantity,
      image: product.image,
    });
  }

  if (Math.abs(computedTotal - total) > 0.001) {
    throw new AppError("Cart total mismatch — refresh your cart", 409);
  }

  for (const line of orderLines) {
    const updated = await Product.findOneAndUpdate(
      {
        _id: line.productId,
        stock: { $gte: line.quantity },
      },
      { $inc: { stock: -line.quantity } },
      { new: true }
    );
    if (!updated) {
      throw new AppError("Product out of stock", 400);
    }
  }

  const order = await Order.create({
    user: userId,
    items: orderLines,
    total: computedTotal,
  });

  await clearCart(userId);

  return order;
}

export async function listOrders(userId) {
  return Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
}

export async function getOrder(userId, orderId) {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new AppError("Invalid order id", 400);
  }
  const order = await Order.findOne({ _id: orderId, user: userId }).lean();
  if (!order) {
    throw new AppError("Order not found", 404);
  }
  return order;
}
