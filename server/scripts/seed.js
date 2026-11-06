import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import { forceResetAndSeed } from "../services/seeder.js";
import mongoose from "mongoose";

dotenv.config();

async function runSeed() {
  console.log("Starting Chalcedony database seed script...");
  const conn = await connectDB();
  if (!conn) {
    console.error("Could not connect to MongoDB. Aborting seed.");
    process.exit(1);
  }

  try {
    const counts = await forceResetAndSeed();
    console.log("Database seeded successfully with defaults:");
    console.table(counts);
    await mongoose.disconnect();
    console.log("Seed complete. Disconnected from database.");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

runSeed();
