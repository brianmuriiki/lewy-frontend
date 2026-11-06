import express from "express";
import mongoose from "mongoose";
import { Inquiry } from "../models/Inquiry.js";
import { protectAdmin } from "../middleware/auth.js";

const router = express.Router();

async function findInquiryByIdOrCustomId(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const doc = await Inquiry.findById(id);
    if (doc) return doc;
  }
  return await Inquiry.findOne({ customId: id });
}

// @route   GET /api/inquiries
// @desc    Get all booking inquiries (protected)
router.get("/", protectAdmin, async (req, res) => {
  try {
    const { status, serviceType } = req.query;
    const filter = {};

    if (status && status !== "All") {
      filter.status = status;
    }

    if (serviceType && serviceType !== "All") {
      filter.serviceType = serviceType;
    }

    const inquiries = await Inquiry.find(filter).sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: inquiries.length,
      data: inquiries,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/inquiries/:id
// @desc    Get single inquiry details (protected)
router.get("/:id", protectAdmin, async (req, res) => {
  try {
    const inquiry = await findInquiryByIdOrCustomId(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }
    return res.json({ success: true, data: inquiry });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/inquiries
// @desc    Public customer booking inquiry submission
router.post("/", async (req, res) => {
  try {
    const {
      fullName,
      phone,
      email,
      serviceType,
      targetItemTitle,
      preferredDate,
      numberOfTravelers,
      destinationOrNotes,
      budgetRange,
    } = req.body;

    if (!fullName || !phone || !email) {
      return res.status(400).json({ message: "Full name, phone, and email are required" });
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const referenceCode = req.body.referenceCode || `CHL-${new Date().getFullYear()}-${randomSuffix}`;
    const customId = req.body.id || `inq-${Date.now()}`;

    const newInquiry = await Inquiry.create({
      customId,
      referenceCode,
      fullName,
      phone,
      email,
      serviceType: serviceType || "Upcoming group trip",
      targetItemTitle: targetItemTitle || "",
      preferredDate: preferredDate || "",
      numberOfTravelers: Number(numberOfTravelers) || 1,
      destinationOrNotes: destinationOrNotes || "",
      budgetRange: budgetRange || "",
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Inquiry submitted successfully",
      data: newInquiry,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// @route   PATCH /api/inquiries/:id
// @desc    Update inquiry status or admin notes (protected)
router.patch("/:id", protectAdmin, async (req, res) => {
  try {
    const inquiry = await findInquiryByIdOrCustomId(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    if (req.body.status) inquiry.status = req.body.status;
    if (req.body.adminNotes !== undefined) inquiry.adminNotes = req.body.adminNotes;

    await inquiry.save();

    return res.json({
      success: true,
      message: "Inquiry updated successfully",
      data: inquiry,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/inquiries/:id
// @desc    Delete inquiry (protected)
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const inquiry = await findInquiryByIdOrCustomId(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    await Inquiry.deleteOne({ _id: inquiry._id });
    return res.json({ success: true, message: "Inquiry deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
