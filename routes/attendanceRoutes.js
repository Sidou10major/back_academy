import express from 'express';
import {
    recordAttendance,
    getSessionAttendance,
    getStudentAttendance
} from '../controllers/attendanceController.js';

const router = express.Router();

router.route('/')
    .post(recordAttendance);

router.route('/session/:sessionId')
    .get(getSessionAttendance);

router.route('/student/:studentId')
    .get(getStudentAttendance);

export default router;