import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    audience: {
        type: String,
        enum: ['all', 'students', 'teachers', 'session'],
        default: 'all'
    },
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClassSession',
        default: null // Only used when audience is 'session'
    },
    priority: {
        type: String,
        enum: ['normal', 'important', 'urgent'],
        default: 'normal'
    },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null } // Optional auto-hide date
}, { timestamps: true });

export default mongoose.model('Announcement', announcementSchema);
