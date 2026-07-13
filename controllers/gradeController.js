import Grade from '../models/Grade.js';

// @desc    Record a grade entry
// @route   POST /api/grades
export const createGrade = async (req, res) => {
    try {
        const grade = new Grade(req.body);
        await grade.save();

        const populated = await Grade.findById(grade._id)
            .populate('student', 'firstName lastName email')
            .populate('teacher', 'firstName lastName')
            .populate({
                path: 'session',
                populate: { path: 'course', select: 'title language level' }
            });

        res.status(201).json(populated);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Get all grades for a session (teacher's gradebook view)
// @route   GET /api/grades/session/:sessionId
export const getGradesBySession = async (req, res) => {
    try {
        const grades = await Grade.find({ session: req.params.sessionId })
            .populate('student', 'firstName lastName email')
            .populate('teacher', 'firstName lastName')
            .sort({ date: -1 });

        res.status(200).json(grades);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get all grades for a student (student's progress view)
// @route   GET /api/grades/student/:studentId
export const getGradesByStudent = async (req, res) => {
    try {
        const grades = await Grade.find({ student: req.params.studentId })
            .populate('teacher', 'firstName lastName')
            .populate({
                path: 'session',
                populate: { path: 'course', select: 'title language level' }
            })
            .sort({ date: -1 });

        res.status(200).json(grades);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get grades for a specific student in a specific session
// @route   GET /api/grades/student/:studentId/session/:sessionId
export const getStudentSessionGrades = async (req, res) => {
    try {
        const grades = await Grade.find({
            student: req.params.studentId,
            session: req.params.sessionId
        })
            .populate('teacher', 'firstName lastName')
            .sort({ date: -1 });

        res.status(200).json(grades);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Compute weighted average for a student in a session
// @route   GET /api/grades/student/:studentId/session/:sessionId/average
export const getStudentSessionAverage = async (req, res) => {
    try {
        const grades = await Grade.find({
            student: req.params.studentId,
            session: req.params.sessionId
        }).lean();

        if (grades.length === 0) {
            return res.status(200).json({
                average: null,
                gradeCount: 0,
                message: 'No grades found for this student in this session.'
            });
        }

        // Weighted average: sum(score/maxScore * weight) / sum(weight) * 100
        let weightedSum = 0;
        let totalWeight = 0;

        // Also compute per-type averages
        const byType = {};

        grades.forEach(g => {
            const normalized = (g.score / g.maxScore) * g.weight;
            weightedSum += normalized;
            totalWeight += g.weight;

            if (!byType[g.type]) {
                byType[g.type] = { totalScore: 0, totalMaxScore: 0, count: 0 };
            }
            byType[g.type].totalScore += g.score;
            byType[g.type].totalMaxScore += g.maxScore;
            byType[g.type].count += 1;
        });

        const weightedAverage = totalWeight > 0
            ? Math.round((weightedSum / totalWeight) * 10000) / 100
            : 0;

        // Compute simple average per type
        const typeBreakdown = {};
        Object.entries(byType).forEach(([type, data]) => {
            typeBreakdown[type] = {
                average: Math.round((data.totalScore / data.totalMaxScore) * 10000) / 100,
                count: data.count
            };
        });

        res.status(200).json({
            weightedAverage,
            gradeCount: grades.length,
            typeBreakdown
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Update a grade
// @route   PUT /api/grades/:id
export const updateGrade = async (req, res) => {
    try {
        const grade = await Grade.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('student', 'firstName lastName email')
            .populate('teacher', 'firstName lastName')
            .populate({
                path: 'session',
                populate: { path: 'course', select: 'title language level' }
            });

        if (!grade) {
            return res.status(404).json({ error: 'Grade not found.' });
        }

        res.status(200).json(grade);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Delete a grade
// @route   DELETE /api/grades/:id
export const deleteGrade = async (req, res) => {
    try {
        const grade = await Grade.findByIdAndDelete(req.params.id);

        if (!grade) {
            return res.status(404).json({ error: 'Grade not found.' });
        }

        res.status(200).json({ message: 'Grade deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
