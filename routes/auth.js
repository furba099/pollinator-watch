const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Middleware to verify token
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

// Register new user
router.post('/register', async (req, res) => {
    const { name, email, password, address } = req.body;
    if (!name || !email || !password || !address) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const hashed = await bcrypt.hash(password, 10);
    try {
        const user = await User.create({ name, email, password: hashed, address });
        res.status(201).json({ message: "User registered" });
    } catch (err) {
        res.status(400).json({ error: "User already exists or invalid data" });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token });
});

// Get current user info (for gallery)
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch user data" });
    }
});

module.exports = router;
