// backend/routes/leaderboard.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ExerciseRecord = require('../models/ExerciseRecord');
const auth = require('../middleware/auth');

// Get global leaderboard
router.get('/', auth, async (req, res) => {
  try {
    // First get all users to ensure we have the mapping
    const users = await User.find({}, 'firebaseUID username email');
    
    // Create a map of firebaseUID to user details
    const userMap = users.reduce((acc, user) => {
      acc[user.firebaseUID] = user;
      return acc;
    }, {});

    // Aggregate exercise records to get total points per user
    const leaderboard = await ExerciseRecord.aggregate([
      {
        $group: {
          _id: '$userId',
          totalPoints: { $sum: '$points' },
          totalExercises: { $sum: 1 }
        }
      },
      { $sort: { totalPoints: -1 } },
      { $limit: 10 }
    ]);

    // Map the aggregated data with user details
    const leaderboardWithUsers = leaderboard.map(entry => {
      const user = userMap[entry._id];
      return {
        userId: entry._id,
        username: user?.username || user?.email?.split('@')[0] || 'Anonymous',
        email: user?.email,
        totalPoints: entry.totalPoints,
        totalExercises: entry.totalExercises
      };
    });

    res.json(leaderboardWithUsers);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
});

module.exports = router;


// // backend/routes/leaderboard.js
// const express = require('express');
// const router = express.Router();
// const User = require('../models/User');

// // Get leaderboard data
// router.get('/:timeFrame', async (req, res) => {
//   try {
//     const { timeFrame } = req.params;
//     let query = {};
    
//     // Add time-based filtering if needed
//     if (timeFrame === 'weekly') {
//       const lastWeek = new Date();
//       lastWeek.setDate(lastWeek.getDate() - 7);
//       query.lastExerciseDate = { $gte: lastWeek };
//     } else if (timeFrame === 'monthly') {
//       const lastMonth = new Date();
//       lastMonth.setMonth(lastMonth.getMonth() - 1);
//       query.lastExerciseDate = { $gte: lastMonth };
//     }

//     const leaderboard = await User.find(query)
//       .sort({ totalScore: -1 })
//       .limit(10)
//       .select('username totalScore exerciseCount accuracy streak');

//     res.json(leaderboard);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// module.exports = router;