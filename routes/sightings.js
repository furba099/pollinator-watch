const express = require("express");
const router = express.Router();
const multer = require("multer");
const authMiddleware = require("../middleware/auth");
const Sighting = require("../models/Sighting"); // ✅ Required for GET route

// Setup multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * @route POST /api/sightings
 * @desc Upload a new sighting
 */
router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { location } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ error: "Image is required" });
    }

    const imageInfo = {
      filename: imageFile.originalname,
      mimetype: imageFile.mimetype,
      size: imageFile.size
    };

    const newSighting = new Sighting({
      location,
      image: imageInfo,
      userId: req.userId
    });

    await newSighting.save();

    res.status(201).json({
      message: "Sighting uploaded successfully",
      location,
      image: imageInfo
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Server error while uploading sighting" });
  }
});

/**
 * @route GET /api/sightings
 * @desc Get all sightings (for gallery)
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const sightings = await Sighting.find().sort({ createdAt: -1 });
    res.json(sightings);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Failed to fetch sightings" });
  }
});

module.exports = router;
