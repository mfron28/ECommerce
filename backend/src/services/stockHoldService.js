import { StockHold } from "../models/StockHold.js";
import { Product } from "../models/Product.js";
import { AppError } from "../utils/errors.js";
import { getCartWithTotals } from "./cartService.js";

export const HOLD_MINUTES = 15;

export async function cleanupExpiredHolds() {
  await StockHold.deleteMany({ expiresAt: { $lt: new Date() } });
}

export async function getReservedQuantity(productId, excludeUserId = null) {
  await cleanupExpiredHolds();
  const filter = {
    product: productId,
    expiresAt: { $gt: new Date() },
  };
  if (excludeUserId) {
    filter.user = { $ne: excludeUserId };
  }
  const holds = await StockHold.find(filter).lean();
  return holds.reduce((sum, h) => sum + h.quantity, 0);
}

export async function getUserHoldExpiry(userId) {
  const hold = await StockHold.findOne({
    user: userId,
    expiresAt: { $gt: new Date() },
  })
    .sort({ expiresAt: -1 })
    .lean();
  return hold?.expiresAt ?? null;
}

export async function reserveCartStock(userId) {
  await cleanupExpiredHolds();
  const { items } = await getCartWithTotals(userId);
  if (!items.length) {
    throw new AppError("Cannot reserve stock for an empty cart", 400);
  }

  await StockHold.deleteMany({ user: userId });

  const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);

  for (const line of items) {
    const product = await Product.findById(line.productId);
    if (!product) {
      throw new AppError("Product not found", 404);
    }
    const reservedByOthers = await getReservedQuantity(product._id, userId);
    const available = product.stock - reservedByOthers;
    if (line.quantity > available) {
      throw new AppError(
        `Not enough stock for ${product.name} (only ${Math.max(0, available)} available)`,
        400
      );
    }
    await StockHold.create({
      user: userId,
      product: product._id,
      quantity: line.quantity,
      expiresAt,
    });
  }

  return { expiresAt, holdMinutes: HOLD_MINUTES };
}

export async function releaseUserHolds(userId) {
  await StockHold.deleteMany({ user: userId });
}

export async function assertActiveHolds(userId) {
  await cleanupExpiredHolds();
  const count = await StockHold.countDocuments({
    user: userId,
    expiresAt: { $gt: new Date() },
  });
  if (count === 0) {
    throw new AppError(
      "Stock reservation expired — return to checkout to reserve again",
      400
    );
  }
}

export async function availableForUser(product, userId) {
  const reservedByOthers = await getReservedQuantity(product._id, userId);
  const userHold = await StockHold.findOne({
    user: userId,
    product: product._id,
    expiresAt: { $gt: new Date() },
  }).lean();
  const heldByUser = userHold?.quantity ?? 0;
  return product.stock - reservedByOthers + heldByUser;
}
