import Attendance from '../models/Attendance.js';

// @desc    Record or update attendance for a specific session and date
// @route   POST /api/attendance
export const recordAttendance = async (req, res) => {
    try {
        const { session, date, teacher, records } = req.body;

        // Normalize the date to midnight to prevent time-zone overlap issues
        const normalizedDate = new Date(date);
        normalizedDate.setUTCHours(0, 0, 0, 0);

        // Using findOneAndUpdate with upsert: true
        // If an entry for this session on this date exists, it updates it. 
        // If not, it creates a new one.
        const attendance = await Attendance.findOneAndUpdate(
            { session, date: normalizedDate },
            { teacher, records },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json(attendance);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Get attendance for a specific session (with optional date filter)
// @route   GET /api/attendance/session/:sessionId?date=YYYY-MM-DD
export const getSessionAttendance = async (req, res) => {
    try {
        let query = { session: req.params.sessionId };

        // If a specific date is requested, filter by it
        if (req.query.date) {
            const normalizedDate = new Date(req.query.date);
            normalizedDate.setUTCHours(0, 0, 0, 0);
            query.date = normalizedDate;
        }

        const attendanceRecords = await Attendance.find(query)
            .populate('teacher', 'firstName lastName')
            .populate('records.student', 'firstName lastName email');

        res.status(200).json(attendanceRecords);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get a specific student's attendance history across all sessions
// @route   GET /api/attendance/student/:studentId
export const getStudentAttendance = async (req, res) => {
    try {
        // Find all attendance sheets where this student's ID appears in the records array
        const attendanceHistory = await Attendance.find({
            "records.student": req.params.studentId
        })
            .populate({
                path: 'session',
                populate: { path: 'course', select: 'title language level' }
            })
            .populate('teacher', 'firstName lastName');

        // Filter down the results to only return this specific student's status, not the whole class
        const studentSpecificRecords = attendanceHistory.map(sheet => {
            const studentRecord = sheet.records.find(
                r => r.student.toString() === req.params.studentId
            );
            return {
                session: sheet.session,
                date: sheet.date,
                teacher: sheet.teacher,
                status: studentRecord.status,
                remarks: studentRecord.remarks
            };
        });

        res.status(200).json(studentSpecificRecords);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};