import express from 'express';
import {
    createSkillAssessment,
    getAssessmentsByStudent,
    getStudentSessionAssessments,
    getAssessmentsBySession,
    getStudentProgress,
    updateSkillAssessment,
    deleteSkillAssessment
} from '../controllers/skillAssessmentController.js';

const router = express.Router();

router.route('/')
    .post(createSkillAssessment);

router.get('/student/:studentId', getAssessmentsByStudent);
router.get('/student/:studentId/session/:sessionId', getStudentSessionAssessments);
router.get('/student/:studentId/progress', getStudentProgress);
router.get('/session/:sessionId', getAssessmentsBySession);

router.route('/:id')
    .put(updateSkillAssessment)
    .delete(deleteSkillAssessment);

export default router;
