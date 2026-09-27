import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDb } from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { AppError } from "./utils/errors.js";
import { cleanupExpiredHolds } from "./services/stockHoldService.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

app.use((_req, _res, next) => {
  next(new AppError("Not found", 404));
});

app.use((err, req, res, next) => {
  errorHandler(err, req, res, next);
});

const port = Number(process.env.PORT) || 5050;

connectDb()
  .then(() => {
    setInterval(() => {
      cleanupExpiredHolds().catch(() => {});
    }, 60 * 1000);

    app.listen(port, () => {
      console.log(`API listening on http://localhost:${port}`);
    });
  })
  .catch((e) => {
    console.error("Failed to connect to MongoDB:", e.message);
    process.exit(1);
  });
