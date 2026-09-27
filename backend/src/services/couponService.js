import { Coupon } from "../models/Coupon.js";
import { AppError } from "../utils/errors.js";

export async function validateCoupon(code, subtotal) {
  const normalized = String(code || "").trim().toUpperCase();
  if (!normalized) {
    throw new AppError("Coupon code is required", 400);
  }
  const coupon = await Coupon.findOne({ code: normalized, active: true });
  if (!coupon) {
    throw new AppError("Invalid or inactive coupon", 400);
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new AppError("Coupon has expired", 400);
  }
  if (subtotal < coupon.minSubtotal) {
    throw new AppError(
      `Minimum order $${coupon.minSubtotal.toFixed(2)} required for this coupon`,
      400
    );
  }

  let discountAmount = 0;
  if (coupon.type === "percent") {
    discountAmount = Math.round(subtotal * (coupon.value / 100) * 100) / 100;
  } else {
    discountAmount = Math.min(coupon.value, subtotal);
  }

  return {
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discountAmount,
  };
}
