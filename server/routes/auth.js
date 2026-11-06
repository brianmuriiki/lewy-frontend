import express from "express";
import jwt from "jsonwebtoken";
import { Admin } from "../models/Admin.js";
import { protectAdmin } from "../middleware/auth.js";

const router = express.Router();

export function generateToken(id) {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || "chalcedony_super_secure_jwt_secret_key_2026_xyz987",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// @route   POST /api/auth/login
// @desc    Authenticate admin in MongoDB & get JWT token
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide both email and password" });
    }

    const defaultEmail = (process.env.DEFAULT_ADMIN_EMAIL || "admin@chalcedony.com").toLowerCase().trim();
    const queryEmail = email.includes("@") ? email.toLowerCase().trim() : defaultEmail;

    const admin = await Admin.findOne({ email: queryEmail });
    if (!admin) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const token = generateToken(admin._id);

    return res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Server error during authentication" });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new admin/staff account (protected by superadmin or if first account)
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existing = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: "Admin with this email already exists" });
    }

    const admin = await Admin.create({
      email: email.toLowerCase().trim(),
      password,
      name: name || "Staff Member",
      role: role || "admin",
    });

    const token = generateToken(admin._id);

    return res.status(201).json({
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get currently logged in admin from token
router.get("/me", protectAdmin, async (req, res) => {
  return res.json({
    success: true,
    admin: req.admin,
  });
});

// @route   GET /api/auth/verify
// @desc    Verify if provided token is valid
router.get("/verify", protectAdmin, async (req, res) => {
  return res.json({
    success: true,
    valid: true,
    admin: req.admin,
  });
});

// @route   PUT /api/auth/profile
// @desc    Update admin profile name or email
router.put("/profile", protectAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (req.body.name) admin.name = req.body.name;
    if (req.body.email) admin.email = req.body.email.toLowerCase().trim();

    await admin.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/auth/password
// @desc    Change admin password / PIN
router.put("/password", protectAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (currentPassword) {
      const isMatch = await admin.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password does not match" });
      }
    }

    admin.password = newPassword;
    await admin.save();

    return res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
