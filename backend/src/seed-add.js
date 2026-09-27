import "dotenv/config";
import mongoose from "mongoose";
import { connectDb } from "./config/db.js";
import { Product } from "./models/Product.js";
import { samples } from "./seed-data.js";

/**
 * Inserts products from seed-data that are not already in the DB (matched by name).
 * Does not delete existing products — safe to run on a live database.
 */
async function seedAdd() {
  await connectDb();
  const existing = await Product.find({}, { name: 1 }).lean();
  const existingNames = new Set(existing.map((p) => p.name));
  const toInsert = samples.filter((p) => !existingNames.has(p.name));
  if (toInsert.length === 0) {
    console.log("No new products to add — catalog already has all seed items.");
  } else {
    await Product.insertMany(toInsert);
    console.log(`Added ${toInsert.length} new product(s). Total in seed catalog: ${samples.length}.`);
  }
  await mongoose.disconnect();
}

seedAdd().catch((e) => {
  console.error(e);
  process.exit(1);
});
