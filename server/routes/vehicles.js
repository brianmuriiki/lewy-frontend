import express from "express";
import mongoose from "mongoose";
import { Vehicle } from "../models/Vehicle.js";
import { protectAdmin } from "../middleware/auth.js";

const router = express.Router();

async function findVehicleByIdOrCustomId(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const doc = await Vehicle.findById(id);
    if (doc) return doc;
  }
  return await Vehicle.findOne({ customId: id });
}

// @route   GET /api/vehicles
// @desc    Get all fleet vehicles
router.get("/", async (req, res) => {
  try {
    const { category, available } = req.query;
    const filter = {};

    if (category && category !== "All") {
      filter.category = category;
    }

    if (available !== undefined) {
      filter.available = available === "true";
    }

    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/vehicles/:id
// @desc    Get vehicle by ID
router.get("/:id", async (req, res) => {
  try {
    const vehicle = await findVehicleByIdOrCustomId(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    return res.json({ success: true, data: vehicle });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/vehicles
// @desc    Add a vehicle to fleet (protected)
router.post("/", protectAdmin, async (req, res) => {
  try {
    const vehicleData = {
      ...req.body,
      customId: req.body.id || req.body.customId || `veh-${Date.now()}`,
    };

    const newVehicle = await Vehicle.create(vehicleData);
    return res.status(201).json({
      success: true,
      message: "Fleet vehicle added successfully",
      data: newVehicle,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/vehicles/:id
// @desc    Update vehicle details (protected)
router.put("/:id", protectAdmin, async (req, res) => {
  try {
    let vehicle = await findVehicleByIdOrCustomId(req.params.id);
    if (!vehicle) {
      const newVehicle = await Vehicle.create({
        ...req.body,
        customId: req.params.id,
      });
      return res.status(201).json({
        success: true,
        message: "Vehicle created",
        data: newVehicle,
      });
    }

    Object.assign(vehicle, req.body);
    await vehicle.save();

    return res.json({
      success: true,
      message: "Vehicle updated successfully",
      data: vehicle,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/vehicles/:id
// @desc    Remove vehicle from fleet (protected)
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const vehicle = await findVehicleByIdOrCustomId(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    await Vehicle.deleteOne({ _id: vehicle._id });
    return res.json({ success: true, message: "Vehicle removed from fleet" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
