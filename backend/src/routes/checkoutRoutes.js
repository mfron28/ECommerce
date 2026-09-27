import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { parseBody } from "../utils/parseBody.js";
import { couponValidateSchema } from "../validation/checkout.js";
import { validateCoupon } from "../services/couponService.js";
import { reserveCartStock } from "../services/stockHoldService.js";
import { SHIPPING_REGIONS } from "../utils/shipping.js";

const router = Router();
router.use(requireAuth);

router.get("/shipping-regions", (_req, res) => {
  res.json({ status: "ok", regions: SHIPPING_REGIONS });
});

router.post("/reserve", async (req, res, next) => {
  try {
    const data = await reserveCartStock(req.user._id);
    res.json({ status: "ok", ...data });
  } catch (e) {
    next(e);
  }
});

router.post("/validate-coupon", async (req, res, next) => {
  try {
    const { code, subtotal } = parseBody(couponValidateSchema, req.body);
    const coupon = await validateCoupon(code, subtotal);
    res.json({ status: "ok", coupon });
  } catch (e) {
    next(e);
  }
});

export default router;
