const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// ✅ Allow CORS only from your Netlify frontend
app.use(cors({
  origin: "https://gregarious-caramel-849921.netlify.app",
  credentials: true
}));

// Middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static('public')); // Serve frontend HTML

// Routes
const authRoutes = require('./routes/auth');
const sightingsRoutes = require('./routes/sightings');

app.use('/api/auth', authRoutes);
app.use('/api/sightings', sightingsRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    // ✅ Listen on port 3000
    app.listen(3000, () => {
      console.log("Server running on http://localhost:3000");
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
