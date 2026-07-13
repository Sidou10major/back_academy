import Message from '../models/Message.js';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import ClassSession from '../models/ClassSession.js';

// @desc    Send a message
// @route   POST /api/messages
export const sendMessage = async (req, res) => {
    try {
        const { sender, recipient, content } = req.body;
        if (!sender || !recipient || !content) {
            return res.status(400).json({ error: 'Sender, recipient and content are required.' });
        }

        const message = new Message({ sender, recipient, content });
        await message.save();

        const populated = await Message.findById(message._id)
            .populate('sender', 'firstName lastName role')
            .populate('recipient', 'firstName lastName role');

        res.status(201).json(populated);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Get chat history between current user and another user
// @route   GET /api/messages/conversation/:otherUserId?currentUserId=xxx
export const getConversation = async (req, res) => {
    try {
        const { otherUserId } = req.params;
        const { currentUserId } = req.query;

        if (!currentUserId) {
            return res.status(400).json({ error: 'currentUserId is required.' });
        }

        // Fetch messages between sender & recipient
        const messages = await Message.find({
            $or: [
                { sender: currentUserId, recipient: otherUserId },
                { sender: otherUserId, recipient: currentUserId }
            ]
        })
        .sort({ createdAt: 1 })
        .populate('sender', 'firstName lastName')
        .populate('recipient', 'firstName lastName');

        // Mark incoming messages as read
        await Message.updateMany(
            { sender: otherUserId, recipient: currentUserId, isRead: false },
            { $set: { isRead: true } }
        );

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get contacts list based on role, with unread message counts
// @route   GET /api/messages/contacts?currentUserId=xxx
export const getContacts = async (req, res) => {
    try {
        const { currentUserId } = req.query;
        if (!currentUserId) {
            return res.status(400).json({ error: 'currentUserId is required.' });
        }

        const currentUser = await User.findById(currentUserId);
        if (!currentUser) {
            return res.status(404).json({ error: 'User not found.' });
        }

        let contacts = [];

        if (currentUser.role === 'admin') {
            // Admins can message any user
            contacts = await User.find({ _id: { $ne: currentUserId } }).select('firstName lastName role email isActive');
        } else if (currentUser.role === 'student') {
            // Students can message teachers of classes they enroll in, and admins
            const enrollments = await Enrollment.find({ student: currentUserId, status: 'Active' });
            const sessionIds = enrollments.map(e => e.session);
            const sessions = await ClassSession.find({ _id: { $in: sessionIds } });
            const teacherIds = sessions.map(s => s.teacher);

            contacts = await User.find({
                $or: [
                    { _id: { $in: teacherIds }, role: 'teacher' },
                    { role: 'admin' }
                ]
            }).select('firstName lastName role email isActive');
        } else if (currentUser.role === 'teacher') {
            // Teachers can message students in their sessions, and admins
            const sessions = await ClassSession.find({ teacher: currentUserId });
            const sessionIds = sessions.map(s => s._id);
            const enrollments = await Enrollment.find({ session: { $in: sessionIds }, status: 'Active' });
            const studentIds = enrollments.map(e => e.student);

            contacts = await User.find({
                $or: [
                    { _id: { $in: studentIds }, role: 'student' },
                    { role: 'admin' }
                ]
            }).select('firstName lastName role email isActive');
        }

        // Get unread count for each contact
        const unreadCounts = await Message.aggregate([
            { $match: { recipient: currentUser._id, isRead: false } },
            { $group: { _id: '$sender', count: { $sum: 1 } } }
        ]);

        const unreadMap = {};
        unreadCounts.forEach(item => {
            unreadMap[item._id.toString()] = item.count;
        });

        const contactsWithUnread = contacts.map(c => {
            const contactObj = c.toObject();
            contactObj.unreadCount = unreadMap[c._id.toString()] || 0;
            return contactObj;
        });

        res.status(200).json(contactsWithUnread);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
