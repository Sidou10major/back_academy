import ClassSession from '../models/ClassSession.js';
import Enrollment from '../models/Enrollment.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { notifyUserViaWhatsApp } from './whatsappService.js';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Periodically checks for class sessions starting in the next 30 minutes.
 * Triggers in-app notifications and WhatsApp alerts.
 */
export const checkUpcomingSessions = async () => {
    try {
        const now = new Date();
        const targetDay = DAYS_OF_WEEK[now.getDay()];

        // Find active/upcoming sessions
        const sessions = await ClassSession.find({
            isActive: true,
            status: { $in: ['Active', 'Upcoming'] },
            startDate: { $lte: now },
            endDate: { $gte: now }
        }).populate('course', 'title');

        for (const session of sessions) {
            for (const sched of session.schedule) {
                if (sched.day !== targetDay) continue;

                // Parse session start time
                const [hours, minutes] = sched.startTime.split(':').map(Number);
                const sessionStart = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                    hours,
                    minutes,
                    0,
                    0
                );

                // Compute time difference in minutes
                const diffMs = sessionStart.getTime() - now.getTime();
                const diffMin = Math.round(diffMs / (60 * 1000));

                // If class starts in 0 to 30 minutes
                if (diffMin >= 0 && diffMin <= 30) {
                    const yyyymmdd = now.toISOString().slice(0, 10);
                    const alertKey = `session_start_${session._id}_${yyyymmdd}`;

                    // Fetch active enrolled students
                    const enrollments = await Enrollment.find({
                        session: session._id,
                        status: 'Active'
                    }).populate('student');

                    // 1. Notify Teacher
                    await triggerSessionAlert(
                        session.teacher,
                        session,
                        alertKey,
                        `🧑‍🏫 Your class "${session.course?.title}" starts in ${diffMin} minutes!`,
                        `Meeting Link: ${session.meetingLink || 'No virtual link set.'}`
                    );

                    // 2. Notify Enrolled Students
                    for (const enroll of enrollments) {
                        if (!enroll.student) continue;
                        await triggerSessionAlert(
                            enroll.student._id,
                            session,
                            alertKey,
                            `🎓 Class starting soon: "${session.course?.title}"`,
                            `Hello ${enroll.student.firstName}! Your language class starts in ${diffMin} minutes. Click to join: ${session.meetingLink || 'No virtual link set.'}`
                        );
                    }
                }
            }
        }
    } catch (error) {
        console.error('❌ Error checking upcoming sessions:', error);
    }
};

/**
 * Triggers an alert (in-app Notification & WhatsApp) for a specific user.
 * Avoids duplicate notifications via sparse alertKey indexing.
 */
const triggerSessionAlert = async (userId, session, alertKey, title, content) => {
    try {
        // Double check if alert was already sent to this user
        const existing = await Notification.findOne({ user: userId, alertKey });
        if (existing) return;

        // Create in-app Notification
        const notification = new Notification({
            user: userId,
            title,
            content,
            alertKey
        });
        await notification.save();

        // Send WhatsApp alert if user has phone configured
        const user = await User.findById(userId).lean();
        if (user && user.phone) {
            notifyUserViaWhatsApp(user, `${title}\n\n${content}`);
        }
    } catch (error) {
        // Duplicate key error might happen in concurrent runs, ignore it
        if (error.code !== 11000) {
            console.error(`❌ Failed to send session alert to ${userId}:`, error.message);
        }
    }
};

/**
 * Starts the alert service polling loop.
 */
export const startAlertService = () => {
    console.log('⏰ Starting Session Alert Service (running every 5 minutes)...');
    // Run initial check immediately
    checkUpcomingSessions();
    // Schedule check every 5 minutes
    setInterval(checkUpcomingSessions, 5 * 60 * 1000);
};
