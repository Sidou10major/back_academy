import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late', 'Excused'],
        required: true
    },
    remarks: {
        type: String,
        default: ""
    }
}, { _id: false }); // Disable _id for sub-documents to keep the DB clean

const attendanceSchema = new mongoose.Schema({
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClassSession',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    records: [attendanceRecordSchema]
}, { timestamps: true });

// Ensure a teacher can only create one attendance sheet per session per day
attendanceSchema.index({ session: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);