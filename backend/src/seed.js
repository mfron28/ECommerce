import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDb } from "./config/db.js";
import { Product } from "./models/Product.js";
import { Coupon } from "./models/Coupon.js";
import { User } from "./models/User.js";
import { samples } from "./seed-data.js";

const GALLERY_BY_CATEGORY = {
  Electronics:
    "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400",
  Apparel:
    "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400",
  Footwear:
    "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400",
  Accessories:
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
  Home: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400",
  Sports:
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400",
  Beauty:
    "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400",
};

function enrichProduct(p) {
  const extra = GALLERY_BY_CATEGORY[p.category];
  const images = [p.image];
  if (extra && extra !== p.image) images.push(extra);
  return {
    ...p,
    images,
    image: p.image,
    lowStockThreshold: p.lowStockThreshold ?? 5,
    ratingAvg: p.ratingAvg ?? 0,
    ratingCount: p.ratingCount ?? 0,
  };
}

async function seed() {
  await connectDb();

  const products = samples.map(enrichProduct);
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log(`Seeded ${products.length} products.`);

  await Coupon.deleteMany({});
  await Coupon.insertMany([
    {
      code: "SAVE10",
      type: "percent",
      value: 10,
      active: true,
      minSubtotal: 0,
    },
    {
      code: "FLAT5",
      type: "fixed",
      value: 5,
      active: true,
      minSubtotal: 25,
    },
    {
      code: "WELCOME20",
      type: "percent",
      value: 20,
      active: true,
      minSubtotal: 50,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  ]);
  console.log("Seeded coupons: SAVE10, FLAT5, WELCOME20");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@shop.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin12345!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await User.findOneAndUpdate(
    { email: adminEmail },
    { email: adminEmail, passwordHash, isAdmin: true },
    { upsert: true, new: true }
  );
  console.log(`Admin user: ${adminEmail} / ${adminPassword}`);

  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
