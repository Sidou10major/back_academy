import Announcement from '../models/Announcement.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';

// ─── Helper: Fan-out notifications to target users ─────────

/**
 * Given an announcement, create one Notification doc per target user.
 * Audience rules:
 *   'all'      → every active user
 *   'students' → users with role 'student'
 *   'teachers' → users with role 'teacher'
 *   'session'  → students enrolled in the specified session
 */
const fanOutNotifications = async (announcement) => {
    let userIds = [];

    switch (announcement.audience) {
        case 'students':
            userIds = (await User.find({ role: 'student', isActive: true }).select('_id').lean())
                .map(u => u._id);
            break;
        case 'teachers':
            userIds = (await User.find({ role: 'teacher', isActive: true }).select('_id').lean())
                .map(u => u._id);
            break;
        case 'session':
            if (announcement.session) {
                userIds = (await Enrollment.find({ session: announcement.session, status: 'Active' }).select('student').lean())
                    .map(e => e.student);
            }
            break;
        case 'all':
        default:
            userIds = (await User.find({ isActive: true }).select('_id').lean())
                .map(u => u._id);
            break;
    }

    // Build notification docs in bulk (skip duplicates via ordered: false)
    if (userIds.length > 0) {
        const docs = userIds.map(userId => ({
            user: userId,
            announcement: announcement._id
        }));

        await Notification.insertMany(docs, { ordered: false }).catch(err => {
            // Ignore duplicate-key errors (code 11000) — they just mean
            // the notification was already sent to that user
            if (err.code !== 11000 && !err.writeErrors) throw err;
        });
    }

    return userIds.length;
};

// ─── Endpoints ─────────────────────────────────────────────

// @desc    Create an announcement and fan out notifications
// @route   POST /api/announcements
export const createAnnouncement = async (req, res) => {
    try {
        const announcement = new Announcement(req.body);
        await announcement.save();

        // Fan-out notifications to target users
        const notifiedCount = await fanOutNotifications(announcement);

        // Populate for the response
        const populated = await Announcement.findById(announcement._id)
            .populate('author', 'firstName lastName role')
            .populate('session', 'startDate endDate');

        res.status(201).json({
            announcement: populated,
            notifiedUsers: notifiedCount
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Get all active announcements (admin view)
// @route   GET /api/announcements?audience=students
export const getAnnouncements = async (req, res) => {
    try {
        const query = { isActive: true };

        if (req.query.audience) {
            query.audience = req.query.audience;
        }

        // Auto-filter expired announcements
        query.$or = [
            { expiresAt: null },
            { expiresAt: { $gte: new Date() } }
        ];

        const announcements = await Announcement.find(query)
            .populate('author', 'firstName lastName role')
            .populate('session', 'startDate endDate')
            .sort({ createdAt: -1 });

        res.status(200).json(announcements);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get a single announcement
// @route   GET /api/announcements/:id
export const getAnnouncementById = async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id)
            .populate('author', 'firstName lastName role')
            .populate('session', 'startDate endDate');

        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found.' });
        }

        res.status(200).json(announcement);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Update an announcement
// @route   PUT /api/announcements/:id
export const updateAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('author', 'firstName lastName role')
            .populate('session', 'startDate endDate');

        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found.' });
        }

        res.status(200).json(announcement);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Soft-delete an announcement (sets isActive to false)
// @route   DELETE /api/announcements/:id
export const deleteAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found.' });
        }

        res.status(200).json({ message: 'Announcement deactivated successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
