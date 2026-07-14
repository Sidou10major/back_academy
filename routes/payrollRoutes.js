import express from 'express';
import {
    calculateTeacherHoursAndPay,
    createOrUpdatePayroll,
    getAllPayrolls,
    payTeacherPayroll,
    deletePayroll
} from '../controllers/payrollController.js';

const router = express.Router();

router.post('/calculate', calculateTeacherHoursAndPay);
router.route('/')
    .post(createOrUpdatePayroll)
    .get(getAllPayrolls);

router.put('/:id/pay', payTeacherPayroll);
router.delete('/:id', deletePayroll);

export default router;
