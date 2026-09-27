import { z } from "zod";

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  line1: z.string().trim().min(1, "Address is required"),
  line2: z.string().trim().optional().default(""),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().optional().default(""),
  postalCode: z.string().trim().min(1, "Postal code is required"),
  country: z.string().trim().min(1, "Country is required"),
});

export const createOrderSchema = z.object({
  shippingAddress: shippingAddressSchema,
  shippingRegion: z.string().trim().optional().default("OTHER"),
  couponCode: z.string().trim().optional(),
});

export const couponValidateSchema = z.object({
  code: z.string().trim().min(1, "Coupon code is required"),
  subtotal: z.coerce.number().min(0),
});
