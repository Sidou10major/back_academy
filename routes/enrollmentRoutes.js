import express from 'express';
import {
    createEnrollment,
    getAllEnrollments,
    getStudentSchedule,
    getSessionRoster,
    updateEnrollmentStatus,
    deleteEnrollment
} from '../controllers/enrollmentController.js';

const router = express.Router();

router.route('/')
    .post(createEnrollment)
    .get(getAllEnrollments);

router.route('/student/:studentId')
    .get(getStudentSchedule);

router.route('/session/:sessionId')
    .get(getSessionRoster);

router.route('/:id')
    .patch(updateEnrollmentStatus)
    .delete(deleteEnrollment);

export default router;