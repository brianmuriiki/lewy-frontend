import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { autoSeedDatabase } from "./services/seeder.js";

import path from "path";
import { fileURLToPath } from "url";

// Route imports
import authRoutes from "./routes/auth.js";
import tripRoutes from "./routes/trips.js";
import vehicleRoutes from "./routes/vehicles.js";
import hotelRoutes from "./routes/hotels.js";
import galleryRoutes from "./routes/gallery.js";
import inquiryRoutes from "./routes/inquiries.js";
import statsRoutes from "./routes/stats.js";
import seedRoutes from "./routes/seed.js";
import uploadRoutes from "./routes/upload.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server-specific .env first
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || process.env.PORT || 5000;
const allowedOrigins = process.env.CORS_ORIGIN || "*";

// Middleware
app.use(
  cors({
    origin: allowedOrigins === "*" ? "*" : allowedOrigins.split(",").map((o) => o.trim()),
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Connect to MongoDB and auto-seed initial data if collections are empty
connectDB().then((conn) => {
  if (conn) {
    autoSeedDatabase();
  }
});

// Health check endpoint (always available)
app.get("/api/health", (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({
    status: isConnected ? "ok" : "degraded",
    database: isConnected ? "connected" : "disconnected",
    service: "Chalcedony Adventures MongoDB API",
    version: "1.0.0",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Guard API routes if database is disconnected
app.use("/api", (req, res, next) => {
  if (req.path === "/health") return next();
  if (mongoose.connection.readyState === 0) {
    return res.status(503).json({
      error: "Service Unavailable",
      message: "MongoDB database is currently disconnected. Please verify MONGODB_URI in server/.env or start MongoDB service.",
    });
  }
  next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/seed", seedRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/images", uploadRoutes);

// Root welcome & API Documentation
app.get("/", (req, res) => {
  res.json({
    service: "Chalcedony Adventures Backend API",
    status: "online",
    endpoints: {
      health: "/api/health",
      auth: {
        login: "POST /api/auth/login",
        me: "GET /api/auth/me",
        register: "POST /api/auth/register",
        profile: "PUT /api/auth/profile",
        password: "PUT /api/auth/password",
      },
      trips: {
        list: "GET /api/trips",
        get: "GET /api/trips/:id",
        create: "POST /api/trips",
        update: "PUT /api/trips/:id",
        delete: "DELETE /api/trips/:id",
      },
      vehicles: {
        list: "GET /api/vehicles",
        get: "GET /api/vehicles/:id",
        create: "POST /api/vehicles",
        update: "PUT /api/vehicles/:id",
        delete: "DELETE /api/vehicles/:id",
      },
      hotels: {
        list: "GET /api/hotels",
        get: "GET /api/hotels/:id",
        create: "POST /api/hotels",
        update: "PUT /api/hotels/:id",
        delete: "DELETE /api/hotels/:id",
      },
      gallery: {
        list: "GET /api/gallery",
        get: "GET /api/gallery/:id",
        create: "POST /api/gallery",
        update: "PUT /api/gallery/:id",
        delete: "DELETE /api/gallery/:id",
      },
      inquiries: {
        list: "GET /api/inquiries",
        get: "GET /api/inquiries/:id",
        create: "POST /api/inquiries",
        update: "PATCH /api/inquiries/:id",
        delete: "DELETE /api/inquiries/:id",
      },
      stats: "GET /api/stats",
      images: {
        upload: "POST /api/upload",
        serve: "GET /api/images/:id",
        list: "GET /api/images",
        delete: "DELETE /api/images/:id",
      },
      seed: "POST /api/seed/reset",
    },
  });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(err.status || 500).json({
    error: "Internal Server Error",
    message: err.message || "An unexpected error occurred",
  });
});

// Start listening when running standalone (not in a serverless environment like Vercel)
if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` Chalcedony MongoDB API Server running on port ${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(` Auth login:   http://localhost:${PORT}/api/auth/login`);
    console.log(` Trips API:    http://localhost:${PORT}/api/trips`);
    console.log(` Vehicles API: http://localhost:${PORT}/api/vehicles`);
    console.log(` Hotels API:   http://localhost:${PORT}/api/hotels`);
    console.log(` Gallery API:  http://localhost:${PORT}/api/gallery`);
    console.log(` Inquiries API:http://localhost:${PORT}/api/inquiries`);
    console.log(` Image upload: http://localhost:${PORT}/api/upload`);
    console.log(`===============================================`);
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: closing HTTP server");
    server.close(() => {
      console.log("HTTP server closed");
    });
  });
}

export default app;
