const express = require("express");
const router = express.Router();
const multer = require("multer");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const Sighting = require("../models/Sighting");
const User = require("../models/User");

// ✅ Middleware to verify token
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

// ✅ Multer for image uploads (to /uploads/)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// ✅ POST /api/sightings — Upload new sighting
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

// ✅ GET /api/sightings — Fetch all sightings
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

// ✅ DELETE /api/sightings/:id — Delete a user's own sighting
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const sighting = await Sighting.findById(req.params.id);
    if (!sighting) return res.status(404).json({ error: "Sighting not found" });

    if (sighting.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: "Not allowed to delete this sighting" });
    }

    // Remove image file
    const filePath = path.join(__dirname, "..", "uploads", sighting.image);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await sighting.deleteOne();
    res.json({ message: "Sighting deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete sighting" });
  }
});

module.exports = router;
