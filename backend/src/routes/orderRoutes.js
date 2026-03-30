import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createOrderFromCart,
  getOrder,
  listOrders,
} from "../services/orderService.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const orders = await listOrders(req.user._id);
    res.json({
      status: "ok",
      orders: orders.map((o) => ({
        id: o._id.toString(),
        items: o.items,
        total: o.total,
        createdAt: o.createdAt,
      })),
    });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const order = await getOrder(req.user._id, req.params.id);
    res.json({
      status: "ok",
      order: {
        id: order._id.toString(),
        items: order.items,
        total: order.total,
        createdAt: order.createdAt,
      },
    });
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const order = await createOrderFromCart(req.user._id);
    res.status(201).json({
      status: "ok",
      order: {
        id: order._id.toString(),
        items: order.items,
        total: order.total,
        createdAt: order.createdAt,
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
