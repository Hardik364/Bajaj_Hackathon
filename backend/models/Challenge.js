const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  exerciseType: {
    type: String,
    required: true,
    enum: ['pushup', 'squat', 'lunges', 'plank']
  },
  targetReps: {
    type: Number,
    required: true,
    min: 1
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  createdBy: {
    type: String,  // Firebase UID
    required: true
  },
  participants: [{
    userId: String,
    username: String,
    completedReps: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Challenge', challengeSchema); 