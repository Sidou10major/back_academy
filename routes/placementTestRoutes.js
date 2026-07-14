import express from 'express';
import {
    submitPlacementTest,
    getStudentTestResults,
    getAllTestResults
} from '../controllers/placementTestController.js';

const router = express.Router();

router.route('/')
    .post(submitPlacementTest)
    .get(getAllTestResults);

router.get('/student/:studentId', getStudentTestResults);

export default router;
