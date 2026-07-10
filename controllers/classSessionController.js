import ClassSession from '../models/ClassSession.js';
import User from '../models/User.js';

// @desc    Create a new class session
// @route   POST /api/sessions
export const createSession = async (req, res) => {
    try {
        const { teacher } = req.body;

        // Verify the assigned user is actually a teacher
        const assignedTeacher = await User.findById(teacher);
        if (!assignedTeacher || assignedTeacher.role !== 'teacher') {
            return res.status(400).json({ error: "Assigned user is not a valid teacher." });
        }

        const session = new ClassSession(req.body);
        await session.save();

        res.status(201).json(session);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Get all active class sessions (with optional filters)
// @route   GET /api/sessions?status=Active&teacher=ID
export const getSessions = async (req, res) => {
    try {
        const { status, teacher, course } = req.query;
        let query = { isActive: true };

        if (status) query.status = status;
        if (teacher) query.teacher = teacher;
        if (course) query.course = course;

        // Populate brings in the nested Course and Teacher data
        const sessions = await ClassSession.find(query)
            .populate('course', 'title language level format')
            .populate('teacher', 'firstName lastName email');

        res.status(200).json(sessions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Update a class session
// @route   PUT /api/sessions/:id
export const updateSession = async (req, res) => {
    try {
        const session = await ClassSession.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .populate('course', 'title language level format')
            .populate('teacher', 'firstName lastName email');
        if (!session) return res.status(404).json({ error: 'Session not found' });
        res.status(200).json(session);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Delete a class session
// @route   DELETE /api/sessions/:id
export const deleteSession = async (req, res) => {
    try {
        const session = await ClassSession.findByIdAndDelete(req.params.id);
        if (!session) return res.status(404).json({ error: 'Session not found' });
        res.status(200).json({ message: 'Session deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};