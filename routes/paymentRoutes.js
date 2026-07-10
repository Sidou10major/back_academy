import express from 'express';
import {
    createPayment,
    confirmPayment,
    enforceOverdueBlocks,
    getStudentPayments,
    getAllPayments,
    updatePayment,
    deletePayment
} from '../controllers/paymentController.js';

const router = express.Router();

router.route('/')
    .post(createPayment)
    .get(getAllPayments);

router.route('/enforce-blocks')
    .put(enforceOverdueBlocks);

router.route('/student/:studentId')
    .get(getStudentPayments);

router.route('/:id/confirm')
    .put(confirmPayment);

router.route('/:id')
    .put(updatePayment)
    .delete(deletePayment);

export default router;