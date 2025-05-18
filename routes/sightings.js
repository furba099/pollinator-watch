const express = require("express");
const router = express.Router();
const multer = require("multer");
const authMiddleware = require("../middleware/auth"); // ✅ correct path

// Use memory storage for demo (or replace with diskStorage if saving to server)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { location } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ error: "Image is required" });
    }

    // Simulate saving the file metadata
    const imageInfo = {
      filename: imageFile.originalname,
      mimetype: imageFile.mimetype,
      size: imageFile.size
    };

    // You can uncomment and adapt this block to save to MongoDB
    /*
    const Sighting = require("../models/Sighting");
    const newSighting = new Sighting({
      location,
      image: imageFile.filename,
      userId: req.userId
    });
    await newSighting.save();
    */

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

module.exports = router;
