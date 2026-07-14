import mongoose from 'mongoose';

const availabilitySlotSchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: true
    },
    startTime: { type: String, required: true }, // e.g. "09:00"
    endTime: { type: String, required: true }    // e.g. "17:00"
}, { _id: false });

const teacherAvailabilitySchema = new mongoose.Schema({
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    slots: [availabilitySlotSchema]
}, { timestamps: true });

export default mongoose.model('TeacherAvailability', teacherAvailabilitySchema);
