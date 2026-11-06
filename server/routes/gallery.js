import express from "express";
import mongoose from "mongoose";
import { Gallery } from "../models/Gallery.js";
import { protectAdmin } from "../middleware/auth.js";

const router = express.Router();

async function findGalleryByIdOrCustomId(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const doc = await Gallery.findById(id);
    if (doc) return doc;
  }
  return await Gallery.findOne({ customId: id });
}

// @route   GET /api/gallery
// @desc    Get all gallery media items
router.get("/", async (req, res) => {
  try {
    const { category, mediaType } = req.query;
    const filter = {};

    if (category && category !== "All") {
      filter.category = category;
    }

    if (mediaType && mediaType !== "All") {
      filter.mediaType = mediaType;
    }

    const items = await Gallery.find(filter).sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/gallery/:id
// @desc    Get gallery item by ID
router.get("/:id", async (req, res) => {
  try {
    const item = await findGalleryByIdOrCustomId(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Gallery item not found" });
    }
    return res.json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/gallery
// @desc    Add new media item to gallery (protected)
router.post("/", protectAdmin, async (req, res) => {
  try {
    const mediaData = {
      ...req.body,
      customId: req.body.id || req.body.customId || `gal-${Date.now()}`,
    };

    const newItem = await Gallery.create(mediaData);
    return res.status(201).json({
      success: true,
      message: "Media item added to gallery",
      data: newItem,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/gallery/:id
// @desc    Update gallery media item (protected)
router.put("/:id", protectAdmin, async (req, res) => {
  try {
    let item = await findGalleryByIdOrCustomId(req.params.id);
    if (!item) {
      const newItem = await Gallery.create({
        ...req.body,
        customId: req.params.id,
      });
      return res.status(201).json({
        success: true,
        message: "Media created",
        data: newItem,
      });
    }

    Object.assign(item, req.body);
    await item.save();

    return res.json({
      success: true,
      message: "Gallery item updated successfully",
      data: item,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/gallery/:id
// @desc    Delete gallery media item (protected)
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const item = await findGalleryByIdOrCustomId(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Gallery item not found" });
    }

    await Gallery.deleteOne({ _id: item._id });
    return res.json({ success: true, message: "Gallery item deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
