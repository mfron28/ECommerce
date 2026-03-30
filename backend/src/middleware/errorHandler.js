import { AppError } from "../utils/errors.js";

export function errorHandler(err, _req, res, _next) {
  const statusCode =
    err instanceof AppError ? err.statusCode : err.statusCode || 500;
  const message =
    err instanceof AppError
      ? err.message
      : statusCode === 500
        ? "Server error"
        : err.message || "Something went wrong";

  if (statusCode === 500 && process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(statusCode).json({
    status: "error",
    message,
  });
}
