import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: true
    },
    startTime: { type: String, required: true }, // e.g., "18:00"
    endTime: { type: String, required: true }    // e.g., "19:30"
}, { _id: false });

const classSessionSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    schedule: [scheduleSchema],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    maxStudents: { type: Number, required: true, min: 1 },
    currentStudents: { type: Number, default: 0 },
    meetingLink: { type: String, default: "" }, // Zoom, Google Meet, Teams, etc.
    status: {
        type: String,
        enum: ['Upcoming', 'Active', 'Completed', 'Canceled'],
        default: 'Upcoming'
    },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('ClassSession', classSessionSchema);