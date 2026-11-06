import mongoose from "mongoose";

// Global cache for serverless environments (Vercel)
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const connUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/chalcedony";
  const maskedUri = connUri.replace(/:([^:@]+)@/, ":****@");

  if (!cached.promise) {
    console.log(`Connecting to MongoDB (${maskedUri})...`);
    cached.promise = mongoose
      .connect(connUri, {
        serverSelectionTimeoutMS: 5000,
      })
      .then((m) => {
        console.log(`MongoDB Connected: ${m.connection.host}/${m.connection.name}`);
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        console.error(`MongoDB Connection Warning: ${err.message}`);
        console.warn("Server will continue running in fallback mode.");
        return null;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}
