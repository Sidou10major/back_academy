import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema({
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    totalHours: { type: Number, required: true, default: 0 },
    hourlyRate: { type: Number, required: true },
    calculatedPay: { type: Number, required: true, default: 0 },
    status: {
        type: String,
        enum: ['Draft', 'Paid'],
        default: 'Draft'
    },
    paymentDate: { type: Date, default: null },
    remarks: { type: String, default: "" }
}, { timestamps: true });

// Prevent duplicate payroll for same teacher and same period
payrollSchema.index({ teacher: 1, periodStart: 1, periodEnd: 1 }, { unique: true });

export default mongoose.model('Payroll', payrollSchema);
