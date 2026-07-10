import Enrollment from '../models/Enrollment.js';
import ClassSession from '../models/ClassSession.js';
import User from '../models/User.js';

// @desc    Enroll a student in a class session
// @route   POST /api/enrollments
export const createEnrollment = async (req, res) => {
    try {
        const { studentId, sessionId } = req.body;

        // 1. Check if the session exists
        const session = await ClassSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Class session not found' });
        }

        // 2. Check Capacity: Is the class already full?
        if (session.currentStudents >= session.maxStudents) {
            return res.status(400).json({ error: 'This class session is already full' });
        }

        // 3. Create the enrollment
        const enrollment = new Enrollment({
            student: studentId,
            session: sessionId
        });

        await enrollment.save();

        // 4. Increment the student count in the session
        session.currentStudents += 1;
        await session.save();

        res.status(201).json(enrollment);
    } catch (error) {
        // Handle the unique index error (double enrollment)
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Student is already enrolled in this session' });
        }
        res.status(400).json({ error: error.message });
    }
};

// @desc    Get a student's schedule
// @route   GET /api/enrollments/student/:studentId
export const getStudentSchedule = async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ student: req.params.studentId, status: 'Active' })
            .populate({
                path: 'session',
                populate: [
                    { path: 'course', select: 'title language level format' },
                    { path: 'teacher', select: 'firstName lastName' }
                ]
            });
        res.json(enrollments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get the roster for a specific session
// @route   GET /api/enrollments/session/:sessionId
export const getSessionRoster = async (req, res) => {
    try {
        const roster = await Enrollment.find({ session: req.params.sessionId, status: 'Active' })
            .populate('student', 'firstName lastName email');
        res.json(roster);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get all enrollments (for admin view)
// @route   GET /api/enrollments
export const getAllEnrollments = async (req, res) => {
    try {
        const enrollments = await Enrollment.find()
            .populate('student', 'firstName lastName email')
            .populate({
                path: 'session',
                populate: [
                    { path: 'course', select: 'title language level format' },
                    { path: 'teacher', select: 'firstName lastName' }
                ]
            })
            .sort({ createdAt: -1 });
        res.json(enrollments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Update enrollment status (e.g., Drop a student)
// @route   PATCH /api/enrollments/:id
export const updateEnrollmentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const enrollment = await Enrollment.findById(req.params.id);

        if (!enrollment) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }

        const previousStatus = enrollment.status;
        enrollment.status = status;
        await enrollment.save();

        // If a student is being dropped from an active enrollment, decrement the count
        if (status === 'Dropped' && previousStatus === 'Active') {
            const session = await ClassSession.findById(enrollment.session);
            if (session && session.currentStudents > 0) {
                session.currentStudents -= 1;
                await session.save();
            }
        }

        res.json(enrollment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Delete an enrollment
// @route   DELETE /api/enrollments/:id
export const deleteEnrollment = async (req, res) => {
    try {
        const enrollment = await Enrollment.findById(req.params.id);
        if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

        // Decrement class count if active
        if (enrollment.status === 'Active') {
            const session = await ClassSession.findById(enrollment.session);
            if (session && session.currentStudents > 0) {
                session.currentStudents -= 1;
                await session.save();
            }
        }

        await Enrollment.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Enrollment record deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};