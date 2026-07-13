import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    announcement: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Announcement',
        required: true
    },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null }
}, { timestamps: true });

// One notification per user per announcement
notificationSchema.index({ user: 1, announcement: 1 }, { unique: true });

// Fast lookup for a user's unread notifications
notificationSchema.index({ user: 1, isRead: 1 });

export default mongoose.model('Notification', notificationSchema);
