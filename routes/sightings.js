const express = require("express");
const router = express.Router();
const multer = require("multer");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");

const Sighting = require("../models/Sighting");
const User = require("../models/User");

// ✅ Auth Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

// ✅ Multer config to store images in /uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

/**
 * @route   POST /api/sightings
 * @desc    Upload a new bee sighting
 * @access  Private
 */
router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { location, description } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ error: "Image is required" });
    }

    const newSighting = new Sighting({
      userId: req.user.userId,
      image: imageFile.filename,
      location,
      description
    });

    await newSighting.save();
    res.status(201).json({ message: "Sighting uploaded successfully" });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Server error while uploading sighting" });
  }
});

/**
 * @route   GET /api/sightings
 * @desc    Get all sightings
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    const sightings = await Sighting.find()
      .sort({ createdAt: -1 })
      .populate("userId", "name email");
    res.json(sightings);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Failed to fetch sightings" });
  }
});

/**
 * @route   DELETE /api/sightings/:id
 * @desc    Delete a sighting (only by uploader)
 * @access  Private
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const sighting = await Sighting.findById(req.params.id);
    if (!sighting) return res.status(404).json({ error: "Sighting not found" });

    if (sighting.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: "Not allowed to delete this sighting" });
    }

    // ✅ Safely extract filename
    const file = typeof sighting.image === "object" ? sighting.image.filename : sighting.image;
    const filePath = path.join(__dirname, "..", "uploads", file);

    if (file && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await sighting.deleteOne();
    res.json({ message: "Sighting deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete sighting" });
  }
});

/**
 * @route   DELETE /api/sightings/clear-all
 * @desc    Delete all sightings and image files (admin only)
 * @access  Unsafe — remove after use!
 */
router.delete("/clear-all", async (req, res) => {
  try {
    const sightings = await Sighting.find();

    sightings.forEach((s) => {
      const file = typeof s.image === 'object' ? s.image.filename : s.image;
      const filePath = path.join(__dirname, "..", "uploads", file);
      if (file && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    await Sighting.deleteMany({});
    res.json({ message: "🧹 All sightings and images deleted." });
  } catch (err) {
    console.error("Clear error:", err);
    res.status(500).json({ error: "Failed to clear sightings" });
  }
});

module.exports = router;
