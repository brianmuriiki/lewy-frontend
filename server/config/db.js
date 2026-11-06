import mongoose from "mongoose";

export async function connectDB() {
  try {
    const connUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/chalcedony";
    const maskedUri = connUri.replace(/:([^:@]+)@/, ":****@");
    console.log(`Connecting to MongoDB (${maskedUri})...`);

    const conn = await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 3000, // Quick fail if local/remote MongoDB is unreachable
    });

    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on("error", (err) => {
      console.error(`MongoDB connection lost: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected.");
    });

    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Warning: ${error.message}`);
    console.warn("Server will continue running in fallback mode.");
    console.warn("To connect to a live MongoDB database, update MONGODB_URI in server/.env");
    return null;
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}
