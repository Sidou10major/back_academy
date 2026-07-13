import mongoose from 'mongoose';

const teacherAttendanceSchema = new mongoose.Schema({
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClassSession',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Present', 'Late', 'Absent'],
        required: true
    },
    remarks: {
        type: String,
        default: ""
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // The Admin who recorded the attendance
    }
}, { timestamps: true });

// Ensure only one attendance record per teacher per session per day
teacherAttendanceSchema.index({ teacher: 1, session: 1, date: 1 }, { unique: true });

export default mongoose.model('TeacherAttendance', teacherAttendanceSchema);
