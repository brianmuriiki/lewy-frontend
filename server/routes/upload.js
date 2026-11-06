import express from "express";
import multer from "multer";
import { Image } from "../models/Image.js";
import { protectAdmin } from "../middleware/auth.js";

const router = express.Router();

const maxFileSize = Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default

// Configure multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPEG, PNG, WebP, GIF, SVG) are allowed"), false);
    }
  },
});

// @route   POST /api/upload
// @desc    Upload an image and store binary directly in MongoDB
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const { category, caption, uploadedBy } = req.body;

    const imageDoc = new Image({
      filename: `${Date.now()}-${req.file.originalname}`,
      originalName: req.file.originalname,
      contentType: req.file.mimetype,
      size: req.file.size,
      data: req.file.buffer, // Binary buffer saved in MongoDB
      category: category || "general",
      caption: caption || "",
      uploadedBy: uploadedBy || (req.admin?.name || "admin"),
    });

    await imageDoc.save();

    // Construct image public URL
    const host = req.get("host");
    const protocol = req.protocol;
    const imageUrl = `${protocol}://${host}/api/images/${imageDoc._id}`;

    return res.status(201).json({
      success: true,
      id: imageDoc._id,
      url: imageUrl,
      filename: imageDoc.filename,
      size: imageDoc.size,
      contentType: imageDoc.contentType,
    });
  } catch (error) {
    console.error("Image Upload Error:", error);
    return res.status(500).json({ message: error.message || "Failed to store image in MongoDB" });
  }
});

// @route   GET /api/images/:id
// @desc    Serve an image directly from MongoDB binary storage
router.get("/:id", async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);

    if (!image || !image.data) {
      return res.status(404).json({ message: "Image not found in MongoDB" });
    }

    // Set HTTP response headers
    res.set("Content-Type", image.contentType);
    res.set("Content-Length", image.size);
    res.set("Cache-Control", "public, max-age=86400"); // Cache for 1 day

    return res.send(image.data);
  } catch (error) {
    console.error("Serve Image Error:", error);
    return res.status(500).json({ message: "Error retrieving image from MongoDB" });
  }
});

// @route   GET /api/images
// @desc    Get list of all images stored in MongoDB
router.get("/", async (req, res) => {
  try {
    const images = await Image.find()
      .select("-data") // Exclude binary buffer for lightweight listing
      .sort({ createdAt: -1 });

    const host = req.get("host");
    const protocol = req.protocol;

    const formatted = images.map((img) => ({
      id: img._id,
      url: `${protocol}://${host}/api/images/${img._id}`,
      filename: img.filename,
      originalName: img.originalName,
      category: img.category,
      size: img.size,
      createdAt: img.createdAt,
    }));

    return res.json({ success: true, count: formatted.length, images: formatted });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/images/:id
// @desc    Delete image from MongoDB
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const image = await Image.findByIdAndDelete(req.params.id);
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }
    return res.json({ success: true, message: "Image deleted from MongoDB" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
