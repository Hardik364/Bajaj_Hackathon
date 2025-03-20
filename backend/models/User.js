const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firebaseUID: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    profile: {
        height: {
            type: String,
            default: ''
        },
        weight: {
            type: String,
            default: ''
        },
        fitnessLevel: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'beginner'
        }
    },
    exerciseStats: {
        points: {
            type: Number,
            default: 0
        },
        totalExercises: {
            type: Number,
            default: 0
        },
        accuracy: {
            type: Number,
            default: 0
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);


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