import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { getCartWithTotals, clearCart } from "./cartService.js";
import { validateCoupon } from "./couponService.js";
import { getShippingCost } from "../utils/shipping.js";
import {
  assertActiveHolds,
  releaseUserHolds,
} from "./stockHoldService.js";
import { AppError } from "../utils/errors.js";

function orderDto(o) {
  return {
    id: o._id.toString(),
    items: o.items,
    status: o.status,
    subtotal: o.subtotal ?? o.total,
    discountAmount: o.discountAmount ?? 0,
    shippingCost: o.shippingCost ?? 0,
    couponCode: o.couponCode,
    shippingRegion: o.shippingRegion,
    shippingAddress: o.shippingAddress,
    total: o.total,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

export async function createOrderFromCart(userId, payload) {
  await assertActiveHolds(userId);

  const { items, subtotal } = await getCartWithTotals(userId);
  if (!items.length) {
    throw new AppError("Cannot checkout with an empty cart", 400);
  }
  for (const line of items) {
    if (line.outOfStock) {
      throw new AppError("Product out of stock", 400);
    }
  }

  const shippingAddress = payload.shippingAddress;
  if (!shippingAddress?.fullName || !shippingAddress?.line1 || !shippingAddress?.city || !shippingAddress?.postalCode || !shippingAddress?.country) {
    throw new AppError("Complete shipping address is required", 400);
  }

  const { region, cost: shippingCost } = getShippingCost(payload.shippingRegion);

  let discountAmount = 0;
  let couponCode = null;
  if (payload.couponCode) {
    const coupon = await validateCoupon(payload.couponCode, subtotal);
    discountAmount = coupon.discountAmount;
    couponCode = coupon.code;
  }

  let computedSubtotal = 0;
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
    computedSubtotal += product.price * line.quantity;
    orderLines.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: line.quantity,
      image: product.image,
    });
  }

  if (Math.abs(computedSubtotal - subtotal) > 0.001) {
    throw new AppError("Cart total mismatch — refresh your cart", 409);
  }

  const total = Math.max(
    0,
    Math.round((computedSubtotal - discountAmount + shippingCost) * 100) / 100
  );

  for (const line of orderLines) {
    const updated = await Product.findOneAndUpdate(
      { _id: line.productId, stock: { $gte: line.quantity } },
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
    status: "pending",
    subtotal: computedSubtotal,
    discountAmount,
    shippingCost,
    couponCode,
    shippingRegion: region,
    shippingAddress,
    total,
  });

  await releaseUserHolds(userId);
  await clearCart(userId);

  return order;
}

export async function listOrders(userId) {
  return Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
}

export async function getOrder(userId, orderId, { admin = false } = {}) {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new AppError("Invalid order id", 400);
  }
  const filter = admin ? { _id: orderId } : { _id: orderId, user: userId };
  const order = await Order.findOne(filter).lean();
  if (!order) {
    throw new AppError("Order not found", 404);
  }
  return order;
}

export async function updateOrderStatus(orderId, status) {
  const allowed = ["pending", "shipped", "delivered"];
  if (!allowed.includes(status)) {
    throw new AppError("Invalid order status", 400);
  }
  const order = await Order.findByIdAndUpdate(
    orderId,
    { status },
    { new: true }
  ).lean();
  if (!order) {
    throw new AppError("Order not found", 404);
  }
  return order;
}

export { orderDto };
