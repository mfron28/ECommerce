import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { parseBody } from "../utils/parseBody.js";
import { AppError } from "../utils/errors.js";
import { Product } from "../models/Product.js";
import { Coupon } from "../models/Coupon.js";
import { productDto } from "../utils/productDto.js";
import {
  deleteCoupon,
  deleteProduct,
  getLowStockProducts,
  getSalesSummary,
  listAllOrders,
  listCoupons,
  saveCoupon,
  upsertProduct,
} from "../services/adminService.js";
import { updateOrderStatus, orderDto } from "../services/orderService.js";
import { z } from "zod";

const router = Router();
router.use(requireAuth, requireAdmin);

const productSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  category: z.string().trim().min(1),
  image: z.string().optional(),
  images: z.array(z.string()).optional(),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
});

const couponSchema = z.object({
  code: z.string().trim().min(1),
  type: z.enum(["percent", "fixed"]),
  value: z.coerce.number().min(0),
  active: z.boolean().optional(),
  expiresAt: z.string().optional().nullable(),
  minSubtotal: z.coerce.number().min(0).optional(),
});

const statusSchema = z.object({
  status: z.enum(["pending", "shipped", "delivered"]),
});

router.get("/stats", async (req, res, next) => {
  try {
    const period = req.query.period || "week";
    const summary = await getSalesSummary(period);
    res.json({ status: "ok", summary });
  } catch (e) {
    next(e);
  }
});

router.get("/products/low-stock", async (_req, res, next) => {
  try {
    const products = await getLowStockProducts();
    res.json({ status: "ok", products });
  } catch (e) {
    next(e);
  }
});

router.get("/products", async (_req, res, next) => {
  try {
    const products = await Product.find().sort({ name: 1 }).lean();
    res.json({
      status: "ok",
      products: products.map((p) => productDto(p)),
    });
  } catch (e) {
    next(e);
  }
});

router.post("/products", async (req, res, next) => {
  try {
    const data = parseBody(productSchema, req.body);
    const product = await upsertProduct(data);
    res.status(201).json({ status: "ok", product });
  } catch (e) {
    next(e);
  }
});

router.put("/products/:id", async (req, res, next) => {
  try {
    const data = parseBody(productSchema, req.body);
    const product = await upsertProduct(data, req.params.id);
    res.json({ status: "ok", product });
  } catch (e) {
    next(e);
  }
});

router.delete("/products/:id", async (req, res, next) => {
  try {
    await deleteProduct(req.params.id);
    res.json({ status: "ok" });
  } catch (e) {
    next(e);
  }
});

router.get("/orders", async (_req, res, next) => {
  try {
    const orders = await listAllOrders();
    res.json({
      status: "ok",
      orders: orders.map((o) => ({
        ...orderDto(o),
        userEmail: o.user?.email,
      })),
    });
  } catch (e) {
    next(e);
  }
});

router.patch("/orders/:id/status", async (req, res, next) => {
  try {
    const { status } = parseBody(statusSchema, req.body);
    const order = await updateOrderStatus(req.params.id, status);
    res.json({ status: "ok", order: orderDto(order) });
  } catch (e) {
    next(e);
  }
});

router.get("/coupons", async (_req, res, next) => {
  try {
    const coupons = await listCoupons();
    res.json({ status: "ok", coupons });
  } catch (e) {
    next(e);
  }
});

router.post("/coupons", async (req, res, next) => {
  try {
    const data = parseBody(couponSchema, req.body);
    if (data.expiresAt) data.expiresAt = new Date(data.expiresAt);
    else data.expiresAt = null;
    const coupon = await saveCoupon(data);
    res.status(201).json({ status: "ok", coupon });
  } catch (e) {
    next(e);
  }
});

router.put("/coupons/:id", async (req, res, next) => {
  try {
    const data = parseBody(couponSchema, req.body);
    if (data.expiresAt) data.expiresAt = new Date(data.expiresAt);
    else data.expiresAt = null;
    const coupon = await saveCoupon(data, req.params.id);
    res.json({ status: "ok", coupon });
  } catch (e) {
    next(e);
  }
});

router.delete("/coupons/:id", async (req, res, next) => {
  try {
    await deleteCoupon(req.params.id);
    res.json({ status: "ok" });
  } catch (e) {
    next(e);
  }
});

export default router;
