import Notification from '../models/Notification.js';

// @desc    Get all notifications for a user
// @route   GET /api/notifications/user/:userId?unreadOnly=true
export const getUserNotifications = async (req, res) => {
    try {
        const query = { user: req.params.userId };

        if (req.query.unreadOnly === 'true') {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .populate({
                path: 'announcement',
                select: 'title content priority audience createdAt',
                populate: { path: 'author', select: 'firstName lastName role' }
            })
            .sort({ createdAt: -1 });

        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found.' });
        }

        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Mark all notifications for a user as read
// @route   PATCH /api/notifications/user/:userId/read-all
export const markAllAsRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { user: req.params.userId, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        res.status(200).json({
            message: 'All notifications marked as read.',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get notification count for a user (total + unread) — for the bell badge
// @route   GET /api/notifications/user/:userId/count
export const getNotificationCount = async (req, res) => {
    try {
        const [total, unread] = await Promise.all([
            Notification.countDocuments({ user: req.params.userId }),
            Notification.countDocuments({ user: req.params.userId, isRead: false })
        ]);

        res.status(200).json({ total, unread });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
