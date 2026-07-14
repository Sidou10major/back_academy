import express from 'express';
import {
    getMyAttendance,
    requestLeave,
    getMyLeaves,
    getAllLeaves,
    handleLeaveStatus,
    saveAvailability,
    getMyAvailability,
    getAllAvailabilities
} from '../controllers/teacherPortalController.js';

const router = express.Router();

// Attendance
router.get('/attendance/:teacherId', getMyAttendance);

// Leaves
router.post('/leave', requestLeave);
router.get('/leave/:teacherId', getMyLeaves);
router.get('/leaves', getAllLeaves);
router.put('/leave/:leaveId/approve', handleLeaveStatus);

// Availability
router.post('/availability', saveAvailability);
router.get('/availability/:teacherId', getMyAvailability);
router.get('/availabilities', getAllAvailabilities);

export default router;
