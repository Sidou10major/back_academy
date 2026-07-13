import express from 'express';
import {
    getOverview,
    getRevenueTrends,
    getEnrollmentTrends,
    getAttendanceStats,
    getTeacherAttendanceStats,
    getCourseStats,
    exportCSV
} from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/overview', getOverview);
router.get('/revenue', getRevenueTrends);
router.get('/enrollments', getEnrollmentTrends);
router.get('/attendance', getAttendanceStats);
router.get('/teacher-attendance', getTeacherAttendanceStats);
router.get('/courses', getCourseStats);
router.get('/export', exportCSV);

export default router;
