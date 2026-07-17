import express from 'express';
import {
    createGrade,
    getAllGrades,
    getGradesBySession,
    getGradesByStudent,
    getStudentSessionGrades,
    getStudentSessionAverage,
    updateGrade,
    deleteGrade
} from '../controllers/gradeController.js';

const router = express.Router();

router.route('/')
    .post(createGrade)
    .get(getAllGrades);

router.get('/session/:sessionId', getGradesBySession);
router.get('/student/:studentId', getGradesByStudent);
router.get('/student/:studentId/session/:sessionId', getStudentSessionGrades);
router.get('/student/:studentId/session/:sessionId/average', getStudentSessionAverage);

router.route('/:id')
    .put(updateGrade)
    .delete(deleteGrade);

export default router;
