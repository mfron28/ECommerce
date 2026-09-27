import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { parseBody } from "../utils/parseBody.js";
import { createOrderSchema } from "../validation/checkout.js";
import {
  createOrderFromCart,
  getOrder,
  listOrders,
  orderDto,
} from "../services/orderService.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const orders = await listOrders(req.user._id);
    res.json({
      status: "ok",
      orders: orders.map((o) => orderDto(o)),
    });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const order = await getOrder(req.user._id, req.params.id);
    res.json({ status: "ok", order: orderDto(order) });
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = parseBody(createOrderSchema, req.body);
    const order = await createOrderFromCart(req.user._id, payload);
    res.status(201).json({ status: "ok", order: orderDto(order) });
  } catch (e) {
    next(e);
  }
});

export default router;
