const express = require('express');
const router = express.Router();
const Challenge = require('../models/Challenge');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { EXERCISE_TYPES } = require('../constants/exerciseTypes');
const ExerciseRecord = require('../models/ExerciseRecord');

// Get all challenges
router.get('/', auth, async (req, res) => {
  try {
    const challenges = await Challenge.find();
    res.json(challenges);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ message: 'Error fetching challenges' });
  }
});

// Create a new challenge
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, exerciseType, targetReps, startDate, endDate } = req.body;
    
    const challenge = new Challenge({
      title,
      description,
      exerciseType,
      targetReps,
      startDate,
      endDate,
      createdBy: req.user.uid,
      participants: [{
        userId: req.user.uid,
        username: req.user.email.split('@')[0], // Using email as username for now
        completedReps: 0,
        accuracy: 0,
        score: 0
      }]
    });

    const savedChallenge = await challenge.save();
    res.status(201).json(savedChallenge);
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ message: 'Error creating challenge', error: error.message });
  }
});

// Join a challenge
router.post('/:id/join', auth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Check if user is already a participant
    if (challenge.participants.some(p => p.userId === req.user.uid)) {
      return res.status(400).json({ message: 'Already joined this challenge' });
    }

    challenge.participants.push({
      userId: req.user.uid,
      username: req.user.email.split('@')[0],
      completedReps: 0,
      accuracy: 0,
      score: 0
    });

    await challenge.save();
    res.json(challenge);
  } catch (error) {
    console.error('Error joining challenge:', error);
    res.status(500).json({ message: 'Error joining challenge' });
  }
});

// Update challenge progress
router.put('/:id/progress', auth, async (req, res) => {
  try {
    const { reps, accuracy, score } = req.body;
    const challenge = await Challenge.findById(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const participant = challenge.participants.find(p => p.userId === req.user.uid);
    if (!participant) {
      return res.status(400).json({ message: 'Not participating in this challenge' });
    }

    participant.completedReps += reps;
    participant.accuracy = accuracy;
    participant.score += score;
    participant.lastUpdated = new Date();

    await challenge.save();
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ message: 'Error updating progress', error: error.message });
  }
});

// Update challenge progress
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const participant = challenge.participants.find(p => p.userId === req.user.uid);
    if (!participant) {
      return res.status(400).json({ message: 'Not participating in this challenge' });
    }

    // Get points for this exercise type
    const exerciseConfig = EXERCISE_TYPES.find(ex => ex.id === challenge.exerciseType);
    const pointsEarned = exerciseConfig ? exerciseConfig.points : 0;

    // Update participant data
    participant.completedReps = req.body.completedReps;
    participant.accuracy = req.body.accuracy;
    participant.score = req.body.score;
    participant.points = pointsEarned;
    participant.completed = true;
    participant.completedAt = new Date();

    await challenge.save();

    // Create exercise record
    const exerciseRecord = new ExerciseRecord({
      userId: req.user.firebaseUID,
      challengeId: challenge._id,
      exerciseType: challenge.exerciseType,
      reps: req.body.completedReps,
      accuracy: req.body.accuracy,
      score: req.body.score,
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
          'stats.completedChallenges': 1
        }
      }
    );

    res.json({
      challenge,
      exerciseRecord
    });
  } catch (error) {
    console.error('Error updating challenge progress:', error);
    res.status(500).json({ message: 'Error updating challenge progress' });
  }
});

// Add a route to get user's exercise history
router.get('/exercise-history', auth, async (req, res) => {
  try {
    const exercises = await ExerciseRecord.find({ userId: req.user.uid })
      .sort({ completedAt: -1 })
      .populate('challengeId', 'title description');
    
    res.json(exercises);
  } catch (error) {
    console.error('Error fetching exercise history:', error);
    res.status(500).json({ message: 'Error fetching exercise history' });
  }
});

module.exports = router; 