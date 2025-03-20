const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ExerciseRecord = require('../models/ExerciseRecord');
const User = require('../models/User');
const { EXERCISE_TYPES } = require('../constants/exerciseTypes');

// Record a completed exercise
router.post('/complete', auth, async (req, res) => {
  try {
    const { exerciseType, reps, accuracy, score } = req.body;

    // Get points for this exercise type
    const exerciseConfig = EXERCISE_TYPES.find(ex => ex.id === exerciseType);
    const pointsEarned = exerciseConfig ? exerciseConfig.points : 0;

    // Create exercise record
    const exerciseRecord = new ExerciseRecord({
      userId: req.user.uid,
      exerciseType,
      reps,
      accuracy,
      score,
      points: pointsEarned,
      completed: true,
      completedAt: new Date()
    });

    await exerciseRecord.save();

    // Update user's exercise stats
    await User.findOneAndUpdate(
      { firebaseUID: req.user.uid },
      {
        $inc: {
          'exerciseStats.points': pointsEarned,
          'exerciseStats.totalExercises': 1,
          'exerciseStats.totalWorkouts': 1
        }
      }
    );

    res.json(exerciseRecord);
  } catch (error) {
    console.error('Error recording exercise:', error);
    res.status(500).json({ message: 'Error recording exercise' });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const records = await ExerciseRecord.find({ userId: req.user.uid })
      .sort({ timestamp: -1 })
      .limit(10);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
