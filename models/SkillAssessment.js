import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema({
    speaking:      { type: Number, min: 0, max: 5, default: 0 },
    listening:     { type: Number, min: 0, max: 5, default: 0 },
    reading:       { type: Number, min: 0, max: 5, default: 0 },
    writing:       { type: Number, min: 0, max: 5, default: 0 },
    grammar:       { type: Number, min: 0, max: 5, default: 0 },
    vocabulary:    { type: Number, min: 0, max: 5, default: 0 },
    pronunciation: { type: Number, min: 0, max: 5, default: 0 }
}, { _id: false });

const skillAssessmentSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClassSession',
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    skills: {
        type: skillSchema,
        required: true
    },
    overallLevel: {
        type: String,
        enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
        default: null // Teacher's overall level assessment (optional)
    },
    remarks: {
        type: String,
        default: ""
    },
    date: {
        type: Date,
        required: true
    }
}, { timestamps: true });

// Index for efficient lookups by student+session
skillAssessmentSchema.index({ student: 1, session: 1, date: 1 });

export default mongoose.model('SkillAssessment', skillAssessmentSchema);
