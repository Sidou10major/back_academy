import SkillAssessment from '../models/SkillAssessment.js';

// @desc    Record a skill assessment
// @route   POST /api/skill-assessments
export const createSkillAssessment = async (req, res) => {
    try {
        const assessment = new SkillAssessment(req.body);
        await assessment.save();

        const populated = await SkillAssessment.findById(assessment._id)
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

// @desc    Get all assessments for a student (progression over time)
// @route   GET /api/skill-assessments/student/:studentId
export const getAssessmentsByStudent = async (req, res) => {
    try {
        const assessments = await SkillAssessment.find({ student: req.params.studentId })
            .populate('teacher', 'firstName lastName')
            .populate({
                path: 'session',
                populate: { path: 'course', select: 'title language level' }
            })
            .sort({ date: -1 });

        res.status(200).json(assessments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get assessments for a specific student in a specific session
// @route   GET /api/skill-assessments/student/:studentId/session/:sessionId
export const getStudentSessionAssessments = async (req, res) => {
    try {
        const assessments = await SkillAssessment.find({
            student: req.params.studentId,
            session: req.params.sessionId
        })
            .populate('teacher', 'firstName lastName')
            .sort({ date: 1 }); // Oldest first — shows progression

        res.status(200).json(assessments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get all assessments for a session (teacher view)
// @route   GET /api/skill-assessments/session/:sessionId
export const getAssessmentsBySession = async (req, res) => {
    try {
        const assessments = await SkillAssessment.find({ session: req.params.sessionId })
            .populate('student', 'firstName lastName email')
            .populate('teacher', 'firstName lastName')
            .sort({ date: -1 });

        res.status(200).json(assessments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Progress report: compare first and latest assessment to show skill growth
// @route   GET /api/skill-assessments/student/:studentId/progress
export const getStudentProgress = async (req, res) => {
    try {
        const studentId = req.params.studentId;

        // Get the earliest and latest assessments
        const [earliest] = await SkillAssessment.find({ student: studentId })
            .sort({ date: 1 })
            .limit(1)
            .populate({
                path: 'session',
                populate: { path: 'course', select: 'title language level' }
            })
            .lean();

        const [latest] = await SkillAssessment.find({ student: studentId })
            .sort({ date: -1 })
            .limit(1)
            .populate({
                path: 'session',
                populate: { path: 'course', select: 'title language level' }
            })
            .lean();

        if (!earliest || !latest) {
            return res.status(200).json({
                message: 'Not enough assessments to compute progress.',
                assessmentCount: earliest ? 1 : 0
            });
        }

        const totalAssessments = await SkillAssessment.countDocuments({ student: studentId });

        // Calculate growth per skill
        const skillNames = ['speaking', 'listening', 'reading', 'writing', 'grammar', 'vocabulary', 'pronunciation'];
        const growth = {};

        skillNames.forEach(skill => {
            const initial = earliest.skills[skill] || 0;
            const current = latest.skills[skill] || 0;
            growth[skill] = {
                initial,
                current,
                change: Math.round((current - initial) * 100) / 100
            };
        });

        res.status(200).json({
            totalAssessments,
            firstAssessment: {
                date: earliest.date,
                session: earliest.session,
                skills: earliest.skills,
                overallLevel: earliest.overallLevel
            },
            latestAssessment: {
                date: latest.date,
                session: latest.session,
                skills: latest.skills,
                overallLevel: latest.overallLevel
            },
            growth
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Update a skill assessment
// @route   PUT /api/skill-assessments/:id
export const updateSkillAssessment = async (req, res) => {
    try {
        const assessment = await SkillAssessment.findByIdAndUpdate(
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

        if (!assessment) {
            return res.status(404).json({ error: 'Skill assessment not found.' });
        }

        res.status(200).json(assessment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Delete a skill assessment
// @route   DELETE /api/skill-assessments/:id
export const deleteSkillAssessment = async (req, res) => {
    try {
        const assessment = await SkillAssessment.findByIdAndDelete(req.params.id);

        if (!assessment) {
            return res.status(404).json({ error: 'Skill assessment not found.' });
        }

        res.status(200).json({ message: 'Skill assessment deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
