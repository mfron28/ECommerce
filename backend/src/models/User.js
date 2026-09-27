import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    pendingEmail: { type: String, lowercase: true, trim: true, default: null },
    emailChangeToken: { type: String, default: null },
    emailChangeExpires: { type: Date, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
