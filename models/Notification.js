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
        required: false
    },
    title: { type: String, default: "" },
    content: { type: String, default: "" },
    alertKey: { type: String, default: null }, // e.g. "session_start_alert_<sessionId>_<yyyy-mm-dd>"
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null }
}, { timestamps: true });

// One notification per user per announcement (if announcement exists)
notificationSchema.index({ user: 1, announcement: 1 }, { unique: true, sparse: true });

// Avoid duplicate alerts for same type of alert key per user
notificationSchema.index({ user: 1, alertKey: 1 }, { unique: true, sparse: true });

// Fast lookup for a user's unread notifications
notificationSchema.index({ user: 1, isRead: 1 });

export default mongoose.model('Notification', notificationSchema);
