import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ["percent", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
    minSubtotal: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const Coupon = mongoose.model("Coupon", couponSchema);
