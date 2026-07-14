import mongoose from 'mongoose';

const placementTestSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    email: { type: String, trim: true, lowercase: true, default: "" },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    recommendedLevel: {
        type: String,
        enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
        required: true
    },
    takenAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('PlacementTest', placementTestSchema);
