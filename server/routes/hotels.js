import express from "express";
import mongoose from "mongoose";
import { Hotel } from "../models/Hotel.js";
import { protectAdmin } from "../middleware/auth.js";

const router = express.Router();

async function findHotelByIdOrCustomId(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const doc = await Hotel.findById(id);
    if (doc) return doc;
  }
  return await Hotel.findOne({ customId: id });
}

// @route   GET /api/hotels
// @desc    Get all hotels and safari stays
router.get("/", async (req, res) => {
  try {
    const { region, category, featured } = req.query;
    const filter = {};

    if (region && region !== "All") {
      filter.region = region;
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    if (featured === "true") {
      filter.featured = true;
    }

    const hotels = await Hotel.find(filter).sort({ rating: -1, createdAt: -1 });
    return res.json({
      success: true,
      count: hotels.length,
      data: hotels,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/hotels/:id
// @desc    Get hotel by ID
router.get("/:id", async (req, res) => {
  try {
    const hotel = await findHotelByIdOrCustomId(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel stay not found" });
    }
    return res.json({ success: true, data: hotel });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/hotels
// @desc    Add new hotel/lodge partnership (protected)
router.post("/", protectAdmin, async (req, res) => {
  try {
    const hotelData = {
      ...req.body,
      customId: req.body.id || req.body.customId || `stay-${Date.now()}`,
    };

    const newHotel = await Hotel.create(hotelData);
    return res.status(201).json({
      success: true,
      message: "Hotel stay added successfully",
      data: newHotel,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/hotels/:id
// @desc    Update hotel details (protected)
router.put("/:id", protectAdmin, async (req, res) => {
  try {
    let hotel = await findHotelByIdOrCustomId(req.params.id);
    if (!hotel) {
      const newHotel = await Hotel.create({
        ...req.body,
        customId: req.params.id,
      });
      return res.status(201).json({
        success: true,
        message: "Hotel created",
        data: newHotel,
      });
    }

    Object.assign(hotel, req.body);
    await hotel.save();

    return res.json({
      success: true,
      message: "Hotel updated successfully",
      data: hotel,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/hotels/:id
// @desc    Delete hotel stay (protected)
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const hotel = await findHotelByIdOrCustomId(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    await Hotel.deleteOne({ _id: hotel._id });
    return res.json({ success: true, message: "Hotel deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
