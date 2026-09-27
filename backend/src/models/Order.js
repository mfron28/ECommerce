import mongoose from "mongoose";

const orderLineSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String, default: "" },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, default: "" },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: [orderLineSchema],
    status: {
      type: String,
      enum: ["pending", "shipped", "delivered"],
      default: "pending",
      index: true,
    },
    subtotal: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, default: null },
    shippingRegion: { type: String, default: "OTHER" },
    shippingAddress: shippingAddressSchema,
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
