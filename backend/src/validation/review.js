import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(3, "Comment is required").max(2000),
});
