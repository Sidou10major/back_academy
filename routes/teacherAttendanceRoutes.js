import express from 'express';
import {
    recordTeacherAttendance,
    getAllTeacherAttendance,
    getTeacherAttendanceBySession,
    getTeacherAttendanceByTeacher,
    deleteTeacherAttendance
} from '../controllers/teacherAttendanceController.js';

const router = express.Router();

router.route('/')
    .post(recordTeacherAttendance)
    .get(getAllTeacherAttendance);

router.route('/session/:sessionId')
    .get(getTeacherAttendanceBySession);

router.route('/teacher/:teacherId')
    .get(getTeacherAttendanceByTeacher);

router.route('/:id')
    .delete(deleteTeacherAttendance);

export default router;
