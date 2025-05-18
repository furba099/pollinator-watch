const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');
const Sighting = require('../models/Sighting');

// Setup file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Middleware to check token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Route to upload a sighting
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const sighting = new Sighting({
            userId: req.user.userId,
            image: req.file.filename,
            location: req.body.location,
        });
        await sighting.save();
        res.json({ message: "Sighting uploaded successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to upload sighting" });
    }
});

// Route to fetch all sightings
router.get('/', async (req, res) => {
    const sightings = await Sighting.find().populate('userId', 'email');
    res.json(sightings);
});

module.exports = router;
