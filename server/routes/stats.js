import express from "express";
import { Trip } from "../models/Trip.js";
import { Vehicle } from "../models/Vehicle.js";
import { Hotel } from "../models/Hotel.js";
import { Gallery } from "../models/Gallery.js";
import { Inquiry } from "../models/Inquiry.js";
import { Image } from "../models/Image.js";
import { protectAdmin } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/stats
// @desc    Get dashboard metrics & summary counts (protected)
router.get("/", protectAdmin, async (req, res) => {
  try {
    const [
      totalTrips,
      totalVehicles,
      totalHotels,
      totalGallery,
      totalInquiries,
      pendingInquiries,
      confirmedInquiries,
      contactedInquiries,
      totalUploadedImages,
    ] = await Promise.all([
      Trip.countDocuments(),
      Vehicle.countDocuments(),
      Hotel.countDocuments(),
      Gallery.countDocuments(),
      Inquiry.countDocuments(),
      Inquiry.countDocuments({ status: "Pending" }),
      Inquiry.countDocuments({ status: "Confirmed" }),
      Inquiry.countDocuments({ status: "Contacted" }),
      Image.countDocuments(),
    ]);

    return res.json({
      success: true,
      stats: {
        trips: totalTrips,
        vehicles: totalVehicles,
        hotels: totalHotels,
        gallery: totalGallery,
        inquiries: {
          total: totalInquiries,
          pending: pendingInquiries,
          confirmed: confirmedInquiries,
          contacted: contactedInquiries,
        },
        uploadedImages: totalUploadedImages,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
