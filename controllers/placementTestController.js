import PlacementTest from '../models/PlacementTest.js';
import User from '../models/User.js';

// @desc    Submit a placement test result
// @route   POST /api/placement-tests
export const submitPlacementTest = async (req, res) => {
    try {
        const { studentId, email, score, totalQuestions } = req.body;

        if (score === undefined || !totalQuestions) {
            return res.status(400).json({ error: 'score and totalQuestions are required' });
        }

        // Auto-recommend CEFR level based on percentage correct
        const percentage = (score / totalQuestions) * 100;
        let recommendedLevel = 'A1';

        if (percentage >= 90) {
            recommendedLevel = 'C2';
        } else if (percentage >= 75) {
            recommendedLevel = 'C1';
        } else if (percentage >= 60) {
            recommendedLevel = 'B2';
        } else if (percentage >= 45) {
            recommendedLevel = 'B1';
        } else if (percentage >= 25) {
            recommendedLevel = 'A2';
        }

        const placementTest = new PlacementTest({
            student: studentId || null,
            email: email || "",
            score,
            totalQuestions,
            recommendedLevel
        });
        await placementTest.save();

        res.status(201).json(placementTest);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Get placement test results for a specific student
// @route   GET /api/placement-tests/student/:studentId
export const getStudentTestResults = async (req, res) => {
    try {
        const { studentId } = req.params;
        const results = await PlacementTest.find({ student: studentId })
            .sort({ takenAt: -1 });
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get all placement test submissions (Admin)
// @route   GET /api/placement-tests
export const getAllTestResults = async (req, res) => {
    try {
        const results = await PlacementTest.find()
            .populate('student', 'firstName lastName email')
            .sort({ takenAt: -1 });
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
