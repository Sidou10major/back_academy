import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClassSession',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['Pending', 'Paid', 'Overdue'],
        default: 'Pending'
    },
    dueDate: {
        type: Date,
        required: true
    },
    paymentDate: {
        type: Date,
        default: null
    },
    confirmedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // The Admin who collected the cash/transfer
    },
    remarks: {
        type: String,
        default: ""
    }
}, { timestamps: true });

// Prevent generating duplicate identical fee requests for the same session
paymentSchema.index({ student: 1, session: 1, dueDate: 1 }, { unique: true });

export default mongoose.model('Payment', paymentSchema);