// models/ExerciseRecord.js
const mongoose = require('mongoose');

const exerciseRecordSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  challengeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge'
  },
  exerciseType: {
    type: String,
    required: true,
    enum: ['pushup', 'squat', 'lunges', 'plank']
  },
  reps: {
    type: Number,
    required: true
  },
  accuracy: {
    type: Number,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  completed: {
    type: Boolean,
    default: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Add timestamps for createdAt and updatedAt
  timestamps: true,
  // Transform _id to id in JSON responses
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
    }
  }
});

// // Add a pre-save middleware to validate data
// exerciseRecordSchema.pre('save', function(next) {
//   if (this.reps < 0) this.reps = 0;
//   if (this.accuracy < 0) this.accuracy = 0;
//   if (this.accuracy > 100) this.accuracy = 100;
//   if (this.score < 0) this.score = 0;
//   next();
// });

module.exports = mongoose.model('ExerciseRecord', exerciseRecordSchema);