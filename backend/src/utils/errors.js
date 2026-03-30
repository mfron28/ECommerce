export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

export function errorResponse(message, statusCode = 400) {
  return { status: "error", message, statusCode };
}
