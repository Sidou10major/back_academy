import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema({
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
    type: {
        type: String,
        enum: ['quiz', 'exam', 'oral', 'homework', 'project', 'participation'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true // e.g. "Week 3 Quiz", "Midterm Oral Exam"
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    maxScore: {
        type: Number,
        default: 100,
        min: 1
    },
    weight: {
        type: Number,
        default: 1,
        min: 0 // Relative weight for weighted average calculation
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
gradeSchema.index({ student: 1, session: 1, date: 1 });

export default mongoose.model('Grade', gradeSchema);
