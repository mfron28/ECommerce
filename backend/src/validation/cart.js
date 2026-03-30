import { z } from "zod";

export const addCartSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
});

export const updateCartSchema = z.object({
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
});
