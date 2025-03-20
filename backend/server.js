// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');  // Added for handling Cross-Origin Resource Sharing
const authRoutes = require('./routes/auth');
const exerciseRoutes = require('./routes/exercise');
const challengeRoutes = require('./routes/challenges');
const User = require('./models/User');
const ExerciseRecord = require('./models/ExerciseRecord');
const leaderboardRoutes = require('./routes/leaderboard'); // Import leaderboard routes

require('dotenv').config(); // Load environment variables from .env file

const app = express();

// Middleware
app.use(cors());  // Enable CORS for all routes
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use('/challenges', challengeRoutes);

// Routes
app.use('/routes/auth', authRoutes);
app.use('/routes/exercise', exerciseRoutes);
app.use('/challenges', challengeRoutes);
app.use('/routes/leaderboard', leaderboardRoutes); // Change from '/leaderboard' to '/routes/leaderboard'

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

const PORT = process.env.PORT || 5001;

// Function to try different ports if the default is busy
const startServer = async (retries = 3) => {
  let currentPort = PORT;
  
  while (retries > 0) {
    try {
      // Try to connect to MongoDB first
      await mongoose.connect(process.env.MONGO_URI);
      console.log('Connected to MongoDB');

      // Then try to start the server
      const server = await new Promise((resolve, reject) => {
        const server = app.listen(currentPort)
          .once('listening', () => resolve(server))
          .once('error', (err) => reject(err));
      });

      console.log(`Server running on port ${currentPort}`);
      return server;
    } catch (error) {
      if (error.code === 'EADDRINUSE') {
        console.log(`Port ${currentPort} is busy, trying ${currentPort + 1}`);
        currentPort++;
        retries--;
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    }
  }

  throw new Error('Could not find an available port');
};

// Start the server
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});

// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//     firebaseUID: {
//         type: String,
//         required: true,
//         unique: true
//     },
//     email: {
//         type: String,
//         required: true,
//         unique: true
//     },
//     username: {
//         type: String,
//         required: true,
//         unique: true
//     },
//     profile: {
//         height: Number,
//         weight: Number,
//         fitnessLevel: {
//             type: String,
//             enum: ['beginner', 'intermediate', 'advanced'],
//             default: 'beginner'
//         }
//     },
//     exerciseStats: {
//         totalWorkouts: { type: Number, default: 0 },
//         totalExercises: { type: Number, default: 0 },
//         points: { type: Number, default: 0 }
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now
//     }
// });

// module.exports = mongoose.model('User', userSchema);



// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// require("dotenv").config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// const PORT = process.env.PORT || 5000;
// const MONGO_URI = process.env.MONGO_URI;

// // Connect to MongoDB
// mongoose
//   .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log("MongoDB Connected"))
//   .catch((err) => console.error(err));

// // Test API route
// app.get("/", (req, res) => {
//   res.send("Backend is running!");
// });

// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
