import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { Coupon } from "../models/Coupon.js";
import { productDto } from "../utils/productDto.js";
import { AppError } from "../utils/errors.js";

export async function getLowStockProducts() {
  const products = await Product.find({
    $expr: { $lte: ["$stock", "$lowStockThreshold"] },
  })
    .sort({ stock: 1 })
    .lean();
  return products.map((p) => ({
    ...productDto(p),
    alert: p.stock === 0 ? "out_of_stock" : "low_stock",
  }));
}

export async function getSalesSummary(period = "week") {
  const days = period === "day" ? 1 : period === "month" ? 30 : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const orders = await Order.find({ createdAt: { $gte: since } }).lean();
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const orderCount = orders.length;

  const byDay = await Order.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        revenue: { $sum: "$total" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const byStatus = await Order.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  return {
    period,
    since,
    revenue: Math.round(revenue * 100) / 100,
    orderCount,
    byDay: byDay.map((d) => ({
      date: d._id,
      revenue: Math.round(d.revenue * 100) / 100,
      orders: d.orders,
    })),
    byStatus: byStatus.reduce((acc, s) => {
      acc[s._id] = s.count;
      return acc;
    }, {}),
  };
}

export async function listAllOrders() {
  return Order.find()
    .populate("user", "email")
    .sort({ createdAt: -1 })
    .lean();
}

export async function upsertProduct(data, id = null) {
  const images =
    Array.isArray(data.images) && data.images.length
      ? data.images
      : data.image
        ? [data.image]
        : [];
  if (!images.length) {
    throw new AppError("At least one image is required", 400);
  }
  const doc = {
    name: data.name,
    description: data.description ?? "",
    price: data.price,
    image: images[0],
    images,
    stock: data.stock,
    category: data.category,
    lowStockThreshold: data.lowStockThreshold ?? 5,
  };
  if (id) {
    const updated = await Product.findByIdAndUpdate(id, doc, { new: true });
    if (!updated) throw new AppError("Product not found", 404);
    return productDto(updated);
  }
  const created = await Product.create(doc);
  return productDto(created);
}

export async function deleteProduct(id) {
  const deleted = await Product.findByIdAndDelete(id);
  if (!deleted) throw new AppError("Product not found", 404);
}

export async function listCoupons() {
  return Coupon.find().sort({ code: 1 }).lean();
}

export async function saveCoupon(data, id = null) {
  const doc = {
    code: String(data.code).trim().toUpperCase(),
    type: data.type,
    value: data.value,
    active: data.active ?? true,
    expiresAt: data.expiresAt || null,
    minSubtotal: data.minSubtotal ?? 0,
  };
  if (id) {
    const updated = await Coupon.findByIdAndUpdate(id, doc, { new: true });
    if (!updated) throw new AppError("Coupon not found", 404);
    return updated;
  }
  try {
    return await Coupon.create(doc);
  } catch (e) {
    if (e.code === 11000) {
      throw new AppError("Coupon code already exists", 409);
    }
    throw e;
  }
}

export async function deleteCoupon(id) {
  const deleted = await Coupon.findByIdAndDelete(id);
  if (!deleted) throw new AppError("Coupon not found", 404);
}
