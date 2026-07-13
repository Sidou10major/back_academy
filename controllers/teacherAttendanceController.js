import TeacherAttendance from '../models/TeacherAttendance.js';

// @desc    Record or update teacher attendance for a specific session and date
// @route   POST /api/teacher-attendance
export const recordTeacherAttendance = async (req, res) => {
    try {
        const { teacher, session, date, status, remarks, markedBy } = req.body;

        // Normalize the date to midnight to prevent time-zone overlap issues
        const normalizedDate = new Date(date);
        normalizedDate.setUTCHours(0, 0, 0, 0);

        // Upsert: if a record exists for this teacher/session/date, update it; otherwise create it
        const record = await TeacherAttendance.findOneAndUpdate(
            { teacher, session, date: normalizedDate },
            { status, remarks, markedBy },
            { new: true, upsert: true, runValidators: true }
        );

        // Populate the response for immediate UI usage
        const populated = await TeacherAttendance.findById(record._id)
            .populate('teacher', 'firstName lastName email')
            .populate('markedBy', 'firstName lastName')
            .populate({
                path: 'session',
                populate: { path: 'course', select: 'title language level' }
            });

        res.status(200).json(populated);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Get all teacher attendance records (with optional filters)
// @route   GET /api/teacher-attendance?date=YYYY-MM-DD&teacherId=xxx
export const getAllTeacherAttendance = async (req, res) => {
    try {
        let query = {};

        if (req.query.teacherId) {
            query.teacher = req.query.teacherId;
        }

        if (req.query.date) {
            const normalizedDate = new Date(req.query.date);
            normalizedDate.setUTCHours(0, 0, 0, 0);
            query.date = normalizedDate;
        }

        const records = await TeacherAttendance.find(query)
            .populate('teacher', 'firstName lastName email')
            .populate('markedBy', 'firstName lastName')
            .populate({
                path: 'session',
                populate: { path: 'course', select: 'title language level' }
            })
            .sort({ date: -1 });

        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get teacher attendance for a specific session
// @route   GET /api/teacher-attendance/session/:sessionId?date=YYYY-MM-DD
export const getTeacherAttendanceBySession = async (req, res) => {
    try {
        let query = { session: req.params.sessionId };

        if (req.query.date) {
            const normalizedDate = new Date(req.query.date);
            normalizedDate.setUTCHours(0, 0, 0, 0);
            query.date = normalizedDate;
        }

        const records = await TeacherAttendance.find(query)
            .populate('teacher', 'firstName lastName email')
            .populate('markedBy', 'firstName lastName')
            .populate({
                path: 'session',
                populate: { path: 'course', select: 'title language level' }
            })
            .sort({ date: -1 });

        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get full attendance history for a specific teacher
// @route   GET /api/teacher-attendance/teacher/:teacherId
export const getTeacherAttendanceByTeacher = async (req, res) => {
    try {
        const records = await TeacherAttendance.find({ teacher: req.params.teacherId })
            .populate('teacher', 'firstName lastName email')
            .populate('markedBy', 'firstName lastName')
            .populate({
                path: 'session',
                populate: { path: 'course', select: 'title language level' }
            })
            .sort({ date: -1 });

        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Delete a specific teacher attendance record
// @route   DELETE /api/teacher-attendance/:id
export const deleteTeacherAttendance = async (req, res) => {
    try {
        const record = await TeacherAttendance.findByIdAndDelete(req.params.id);

        if (!record) {
            return res.status(404).json({ error: 'Attendance record not found.' });
        }

        res.status(200).json({ message: 'Teacher attendance record deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
