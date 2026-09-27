import mongoose from "mongoose";

const stockHoldSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

stockHoldSchema.index({ user: 1, product: 1 });

export const StockHold = mongoose.model("StockHold", stockHoldSchema);
