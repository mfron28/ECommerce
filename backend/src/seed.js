import "dotenv/config";
import mongoose from "mongoose";
import { connectDb } from "./config/db.js";
import { Product } from "./models/Product.js";

const samples = [
  {
    name: "Wireless Headphones",
    description: "Noise-cancelling over-ear headphones with 30h battery.",
    price: 129.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    stock: 25,
    category: "Electronics",
  },
  {
    name: "Mechanical Keyboard",
    description: "RGB backlit keys, tactile switches.",
    price: 89.5,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400",
    stock: 0,
    category: "Electronics",
  },
  {
    name: "Cotton T-Shirt",
    description: "Soft organic cotton, unisex fit.",
    price: 24.99,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
    stock: 100,
    category: "Apparel",
  },
  {
    name: "Running Shoes",
    description: "Lightweight trainers for daily runs.",
    price: 99.0,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
    stock: 15,
    category: "Footwear",
  },
  {
    name: "Stainless Water Bottle",
    description: "Insulated 750ml bottle.",
    price: 32.0,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400",
    stock: 40,
    category: "Accessories",
  },
  {
    name: "Leather Wallet",
    description: "Slim bifold with RFID blocking.",
    price: 45.99,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400",
    stock: 8,
    category: "Accessories",
  },
];

async function seed() {
  await connectDb();
  await Product.deleteMany({});
  await Product.insertMany(samples);
  console.log(`Seeded ${samples.length} products.`);
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
