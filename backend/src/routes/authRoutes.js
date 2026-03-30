import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { AppError } from "../utils/errors.js";
import { loginSchema, registerSchema } from "../validation/auth.js";
import { parseBody } from "../utils/parseBody.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function signToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError("Server misconfiguration", 500);
  }
  return jwt.sign({ sub: userId }, secret, { expiresIn: "7d" });
}

router.post("/register", async (req, res, next) => {
  try {
    const { email, password } = parseBody(registerSchema, req.body);
    const existing = await User.findOne({ email });
    if (existing) {
      throw new AppError("Email already registered", 409);
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });
    const token = signToken(user._id.toString());
    res.status(201).json({
      status: "ok",
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (e) {
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = parseBody(loginSchema, req.body);
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw new AppError("Wrong password", 401);
    }
    const token = signToken(user._id.toString());
    res.json({
      status: "ok",
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (e) {
    next(e);
  }
});

router.post("/logout", requireAuth, (_req, res) => {
  res.json({ status: "ok", message: "Logged out" });
});

export default router;
