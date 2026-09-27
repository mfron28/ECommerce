import crypto from "crypto";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { AppError } from "../utils/errors.js";
import {
  sendEmail,
  buildResetEmail,
  buildVerifyEmail,
} from "./emailService.js";

function token() {
  return crypto.randomBytes(32).toString("hex");
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) throw new AppError("Current password is incorrect", 401);
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
}

export async function requestEmailChange(userId, newEmail) {
  const normalized = String(newEmail).trim().toLowerCase();
  const taken = await User.findOne({ email: normalized });
  if (taken) throw new AppError("Email already in use", 409);
  const pending = await User.findOne({ pendingEmail: normalized });
  if (pending && pending._id.toString() !== userId.toString()) {
    throw new AppError("Email already pending verification", 409);
  }
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  if (user.email === normalized) {
    throw new AppError("That is already your email", 400);
  }

  const emailChangeToken = token();
  user.pendingEmail = normalized;
  user.emailChangeToken = emailChangeToken;
  user.emailChangeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  const appUrl = process.env.APP_URL || "http://localhost:5173";
  const link = `${appUrl}/verify-email?token=${emailChangeToken}`;
  const mail = buildVerifyEmail(link);
  await sendEmail({ to: normalized, ...mail });

  return { pendingEmail: normalized };
}

export async function confirmEmailChange(emailChangeToken) {
  const user = await User.findOne({
    emailChangeToken,
    emailChangeExpires: { $gt: new Date() },
  });
  if (!user || !user.pendingEmail) {
    throw new AppError("Invalid or expired verification link", 400);
  }
  const taken = await User.findOne({ email: user.pendingEmail });
  if (taken && taken._id.toString() !== user._id.toString()) {
    throw new AppError("Email no longer available", 409);
  }
  user.email = user.pendingEmail;
  user.pendingEmail = null;
  user.emailChangeToken = null;
  user.emailChangeExpires = null;
  await user.save();
  return user;
}

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email: String(email).trim().toLowerCase() });
  if (!user) {
    return { message: "If that email exists, a reset link was sent" };
  }
  user.resetPasswordToken = token();
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const appUrl = process.env.APP_URL || "http://localhost:5173";
  const link = `${appUrl}/reset-password?token=${user.resetPasswordToken}`;
  const mail = buildResetEmail(link);
  await sendEmail({ to: user.email, ...mail });

  return { message: "If that email exists, a reset link was sent" };
}

export async function resetPassword(resetToken, newPassword) {
  const user = await User.findOne({
    resetPasswordToken: resetToken,
    resetPasswordExpires: { $gt: new Date() },
  });
  if (!user) {
    throw new AppError("Invalid or expired reset link", 400);
  }
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();
  return user;
}
