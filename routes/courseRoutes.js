import express from 'express';
import { createCourse, getCourses, updateCourse, deleteCourse } from '../controllers/courseController.js';

const router = express.Router();

router.route('/')
    .post(createCourse)
    .get(getCourses);

router.route('/:id')
    .put(updateCourse)
    .delete(deleteCourse);

export default router;