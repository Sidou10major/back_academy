import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
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
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Active', 'Dropped', 'Completed'],
        default: 'Active'
    }
}, { timestamps: true });

// Prevent a student from enrolling in the exact same session twice
enrollmentSchema.index({ student: 1, session: 1 }, { unique: true });

export default mongoose.model('Enrollment', enrollmentSchema);