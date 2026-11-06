import express from "express";
import { forceResetAndSeed } from "../services/seeder.js";
import { protectAdmin } from "../middleware/auth.js";

const router = express.Router();

// @route   POST /api/seed/reset
// @desc    Reset all collections to initial seed data (protected)
router.post("/reset", protectAdmin, async (req, res) => {
  try {
    const counts = await forceResetAndSeed();
    return res.json({
      success: true,
      message: "Database reset to factory default seed data successfully",
      counts,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
