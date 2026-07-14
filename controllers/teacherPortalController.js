import TeacherLeave from '../models/TeacherLeave.js';
import TeacherAvailability from '../models/TeacherAvailability.js';
import TeacherAttendance from '../models/TeacherAttendance.js';
import User from '../models/User.js';

// ─── Attendance ─────────────────────────────────────────────

// @desc    Get attendance history for a teacher
// @route   GET /api/teacher-portal/attendance/:teacherId
export const getMyAttendance = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const attendance = await TeacherAttendance.find({ teacher: teacherId })
            .populate({
                path: 'session',
                populate: { path: 'course', select: 'title language level' }
            })
            .sort({ date: -1 });

        res.status(200).json(attendance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── Leave Requests ─────────────────────────────────────────

// @desc    Submit a leave request
// @route   POST /api/teacher-portal/leave
export const requestLeave = async (req, res) => {
    try {
        const { teacher, startDate, endDate, reason } = req.body;
        if (!teacher || !startDate || !endDate || !reason) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const leave = new TeacherLeave({
            teacher,
            startDate,
            endDate,
            reason
        });
        await leave.save();

        res.status(201).json(leave);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Get leave requests for a specific teacher
// @route   GET /api/teacher-portal/leave/:teacherId
export const getMyLeaves = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const leaves = await TeacherLeave.find({ teacher: teacherId })
            .sort({ createdAt: -1 });
        res.status(200).json(leaves);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get all leave requests (Admin)
// @route   GET /api/teacher-portal/leaves
export const getAllLeaves = async (req, res) => {
    try {
        const leaves = await TeacherLeave.find()
            .populate('teacher', 'firstName lastName email')
            .sort({ createdAt: -1 });
        res.status(200).json(leaves);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Approve or Reject a leave request (Admin)
// @route   PUT /api/teacher-portal/leave/:leaveId/approve
export const handleLeaveStatus = async (req, res) => {
    try {
        const { leaveId } = req.params;
        const { status, remarks, adminId } = req.body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be Approved or Rejected' });
        }

        const leave = await TeacherLeave.findById(leaveId);
        if (!leave) return res.status(404).json({ error: 'Leave request not found' });

        leave.status = status;
        leave.remarks = remarks || "";
        leave.handledBy = adminId;
        await leave.save();

        const populated = await TeacherLeave.findById(leaveId).populate('teacher', 'firstName lastName email');
        res.status(200).json(populated);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// ─── Availability ───────────────────────────────────────────

// @desc    Submit or update scheduling availability
// @route   POST /api/teacher-portal/availability
export const saveAvailability = async (req, res) => {
    try {
        const { teacher, slots } = req.body;
        if (!teacher || !slots) {
            return res.status(400).json({ error: 'Teacher and slots are required' });
        }

        let availability = await TeacherAvailability.findOne({ teacher });
        if (availability) {
            availability.slots = slots;
            await availability.save();
        } else {
            availability = new TeacherAvailability({ teacher, slots });
            await availability.save();
        }

        res.status(200).json(availability);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Get availability for a specific teacher
// @route   GET /api/teacher-portal/availability/:teacherId
export const getMyAvailability = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const availability = await TeacherAvailability.findOne({ teacher: teacherId });
        if (!availability) {
            return res.status(200).json({ teacher: teacherId, slots: [] });
        }
        res.status(200).json(availability);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get all teacher availabilities (Admin)
// @route   GET /api/teacher-portal/availabilities
export const getAllAvailabilities = async (req, res) => {
    try {
        const availabilities = await TeacherAvailability.find()
            .populate('teacher', 'firstName lastName email');
        res.status(200).json(availabilities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
