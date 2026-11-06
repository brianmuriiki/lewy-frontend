import express from "express";
import mongoose from "mongoose";
import { Trip } from "../models/Trip.js";
import { protectAdmin } from "../middleware/auth.js";

const router = express.Router();

// Helper to find a trip by customId or MongoDB _id
async function findTripByIdOrCustomId(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const doc = await Trip.findById(id);
    if (doc) return doc;
  }
  return await Trip.findOne({ customId: id });
}

// @route   GET /api/trips
// @desc    Get all trips with filtering & search
router.get("/", async (req, res) => {
  try {
    const { category, featured, search } = req.query;
    const filter = {};

    if (category && category !== "All") {
      filter.category = category;
    }

    if (featured === "true") {
      filter.featured = true;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { overview: { $regex: search, $options: "i" } },
      ];
    }

    const trips = await Trip.find(filter).sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: trips.length,
      data: trips,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/trips/:id
// @desc    Get single trip by ID or customId
router.get("/:id", async (req, res) => {
  try {
    const trip = await findTripByIdOrCustomId(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }
    return res.json({ success: true, data: trip });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/trips
// @desc    Create a new trip package (protected)
router.post("/", protectAdmin, async (req, res) => {
  try {
    const tripData = {
      ...req.body,
      customId: req.body.id || req.body.customId || `trip-${Date.now()}`,
    };

    const newTrip = await Trip.create(tripData);
    return res.status(201).json({
      success: true,
      message: "Trip package created successfully",
      data: newTrip,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/trips/:id
// @desc    Update an existing trip package (protected)
router.put("/:id", protectAdmin, async (req, res) => {
  try {
    let trip = await findTripByIdOrCustomId(req.params.id);
    if (!trip) {
      // If not found, create new with the provided id
      const newTrip = await Trip.create({
        ...req.body,
        customId: req.params.id,
      });
      return res.status(201).json({
        success: true,
        message: "Trip created",
        data: newTrip,
      });
    }

    Object.assign(trip, req.body);
    await trip.save();

    return res.json({
      success: true,
      message: "Trip updated successfully",
      data: trip,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/trips/:id
// @desc    Delete a trip package (protected)
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const trip = await findTripByIdOrCustomId(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    await Trip.deleteOne({ _id: trip._id });
    return res.json({ success: true, message: "Trip deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
