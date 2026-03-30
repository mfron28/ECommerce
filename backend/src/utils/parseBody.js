import { ZodError } from "zod";
import { AppError } from "./errors.js";

export function parseBody(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const msg =
      result.error.errors[0]?.message ||
      result.error.flatten().formErrors[0] ||
      "Invalid input";
    throw new AppError(msg, 400);
  }
  return result.data;
}

export function handleZodInMiddleware(err, next) {
  if (err instanceof ZodError) {
    const msg = err.errors[0]?.message || "Invalid input";
    next(new AppError(msg, 400));
    return true;
  }
  return false;
}
