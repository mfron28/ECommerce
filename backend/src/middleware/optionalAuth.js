import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next();
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("-passwordHash");
    if (user) req.user = user;
  } catch {
    /* ignore */
  }
  next();
}
