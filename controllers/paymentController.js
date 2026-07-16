import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { notifyUserViaWhatsApp, notifyUsersViaWhatsApp } from '../services/whatsappService.js';

// @desc    Generate a new fee/payment request for a student
// @route   POST /api/payments
export const createPayment = async (req, res) => {
    try {
        const { student: studentId, currency } = req.body;
        let finalCurrency = currency;

        if (!finalCurrency && studentId) {
            const student = await User.findById(studentId);
            if (student) {
                const isAlgerian = student.residence && student.residence.trim().toLowerCase() === 'algeria';
                finalCurrency = isAlgerian ? 'DZD' : 'USD';
            }
        }

        if (!finalCurrency) {
            finalCurrency = 'DZD';
        }

        const payment = new Payment({ ...req.body, currency: finalCurrency });
        await payment.save();
        res.status(201).json(payment);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'This fee has already been generated for this student.' });
        }
        res.status(400).json({ error: error.message });
    }
};

// @desc    Admin confirms a payment has been received (Reactivates Student)
// @route   PUT /api/payments/:id/confirm
export const confirmPayment = async (req, res) => {
    try {
        const { adminId, remarks } = req.body;

        const payment = await Payment.findById(req.params.id);
        if (!payment) return res.status(404).json({ error: 'Payment record not found' });

        // Update payment record
        payment.status = 'Paid';
        payment.paymentDate = new Date();
        payment.confirmedBy = adminId;
        if (remarks) payment.remarks = remarks;

        await payment.save();

        // Reactivate the student's account
        await User.findByIdAndUpdate(payment.student, { isActive: true });

        // Send WhatsApp notification to the student (fire-and-forget)
        const student = await User.findById(payment.student).lean();
        if (student?.phone) {
            notifyUserViaWhatsApp(student,
                `✅ Hello ${student.firstName}! Your payment has been confirmed and your account is now active. Thank you!`
            );
        }

        res.status(200).json({ message: 'Payment confirmed and student account is active.', payment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Scan for overdue payments and block unpaid students
// @route   PUT /api/payments/enforce-blocks
export const enforceOverdueBlocks = async (req, res) => {
    try {
        const today = new Date();

        // 1. Find all pending payments where the due date has passed
        const overduePayments = await Payment.find({
            status: 'Pending',
            dueDate: { $lt: today }
        });

        if (overduePayments.length === 0) {
            return res.status(200).json({ message: 'No new overdue payments found.' });
        }

        // 2. Extract unique student IDs who are overdue
        const studentIdsToBlock = [...new Set(overduePayments.map(p => p.student.toString()))];

        // 3. Mark the payments as 'Overdue'
        await Payment.updateMany(
            { _id: { $in: overduePayments.map(p => p._id) } },
            { $set: { status: 'Overdue' } }
        );

        // 4. Block the students by setting isActive to false
        await User.updateMany(
            { _id: { $in: studentIdsToBlock } },
            { $set: { isActive: false } }
        );

        // 5. Send WhatsApp notifications to blocked students (fire-and-forget)
        const blockedStudents = await User.find({ _id: { $in: studentIdsToBlock } }).lean();
        notifyUsersViaWhatsApp(blockedStudents,
            `⚠️ Your account has been temporarily blocked due to an overdue payment. Please contact the administration to resolve this.`
        );

        res.status(200).json({
            message: `Enforcement complete. Blocked ${studentIdsToBlock.length} student(s).`,
            blockedStudents: studentIdsToBlock
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get all payments for a specific student
// @route   GET /api/payments/student/:studentId
export const getStudentPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ student: req.params.studentId })
            .populate('session', 'startDate endDate')
            .populate('confirmedBy', 'firstName lastName'); // Show which admin approved it

        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get all payments (Admin use)
// @route   GET /api/payments
export const getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('student', 'firstName lastName email')
            .populate({
                path: 'session',
                populate: { path: 'course', select: 'title' }
            });
        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Update a payment request
// @route   PUT /api/payments/:id
export const updatePayment = async (req, res) => {
    try {
        const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .populate('student', 'firstName lastName email')
            .populate({
                path: 'session',
                populate: { path: 'course', select: 'title' }
            });
        if (!payment) return res.status(404).json({ error: 'Payment not found' });
        res.status(200).json(payment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Delete a payment request
// @route   DELETE /api/payments/:id
export const deletePayment = async (req, res) => {
    try {
        const payment = await Payment.findByIdAndDelete(req.params.id);
        if (!payment) return res.status(404).json({ error: 'Payment not found' });
        res.status(200).json({ message: 'Payment record deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};