import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  addToCart,
  getCartWithTotals,
  removeCartLine,
  updateCartLine,
} from "../services/cartService.js";
import { addCartSchema, updateCartSchema } from "../validation/cart.js";
import { parseBody } from "../utils/parseBody.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const data = await getCartWithTotals(req.user._id);
    res.json({ status: "ok", ...data });
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { productId, quantity } = parseBody(addCartSchema, req.body);
    const data = await addToCart(req.user._id, productId, quantity);
    res.status(201).json({ status: "ok", ...data });
  } catch (e) {
    next(e);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { quantity } = parseBody(updateCartSchema, req.body);
    const data = await updateCartLine(
      req.user._id,
      req.params.id,
      quantity
    );
    res.json({ status: "ok", ...data });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const data = await removeCartLine(req.user._id, req.params.id);
    res.json({ status: "ok", ...data });
  } catch (e) {
    next(e);
  }
});

export default router;
