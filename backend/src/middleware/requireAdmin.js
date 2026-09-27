import { AppError } from "../utils/errors.js";

export function requireAdmin(req, _res, next) {
  if (!req.user?.isAdmin) {
    next(new AppError("Admin access required", 403));
    return;
  }
  next();
}
