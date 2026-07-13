import User from '../models/User.js';
import Course from '../models/Course.js';
import ClassSession from '../models/ClassSession.js';
import Enrollment from '../models/Enrollment.js';
import Payment from '../models/Payment.js';
import Attendance from '../models/Attendance.js';
import TeacherAttendance from '../models/TeacherAttendance.js';

// ─── Helpers ───────────────────────────────────────────────

/**
 * Build a MongoDB date-grouping expression based on the requested granularity.
 * Used by revenue and enrollment trend endpoints.
 */
const buildDateGroup = (groupBy) => {
    switch (groupBy) {
        case 'day':
            return { $dateToString: { format: '%Y-%m-%d', date: '$_dateField' } };
        case 'week':
            return { $dateToString: { format: '%Y-W%V', date: '$_dateField' } };
        case 'month':
        default:
            return { $dateToString: { format: '%Y-%m', date: '$_dateField' } };
    }
};

/**
 * Parse optional startDate / endDate query params into a Mongo date range filter.
 */
const buildDateRange = (startDate, endDate, field = 'date') => {
    const filter = {};
    if (startDate || endDate) {
        filter[field] = {};
        if (startDate) filter[field].$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setUTCHours(23, 59, 59, 999);
            filter[field].$lte = end;
        }
    }
    return filter;
};

// ─── 1. Overview ───────────────────────────────────────────

// @desc    Quick dashboard summary (counts + totals)
// @route   GET /api/analytics/overview
export const getOverview = async (req, res) => {
    try {
        const [
            totalStudents,
            totalTeachers,
            activeCourses,
            activeSessions,
            revenueAgg,
            pendingPayments
        ] = await Promise.all([
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: 'teacher' }),
            Course.countDocuments({ isActive: true }),
            ClassSession.countDocuments({ status: { $in: ['Upcoming', 'Active'] } }),
            Payment.aggregate([
                { $match: { status: 'Paid' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Payment.countDocuments({ status: 'Pending' })
        ]);

        res.status(200).json({
            totalStudents,
            totalTeachers,
            activeCourses,
            activeSessions,
            totalRevenue: revenueAgg.length > 0 ? revenueAgg[0].total : 0,
            pendingPayments
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── 2. Revenue Trends ────────────────────────────────────

// @desc    Revenue over time (grouped by day/week/month)
// @route   GET /api/analytics/revenue?startDate=&endDate=&groupBy=month
export const getRevenueTrends = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'month' } = req.query;
        const dateRange = buildDateRange(startDate, endDate, 'paymentDate');

        const pipeline = [
            { $match: { status: 'Paid', ...dateRange } },
            {
                $addFields: { _dateField: '$paymentDate' }
            },
            {
                $group: {
                    _id: buildDateGroup(groupBy),
                    totalRevenue: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, period: '$_id', totalRevenue: 1, count: 1 } }
        ];

        const trends = await Payment.aggregate(pipeline);
        res.status(200).json(trends);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── 3. Enrollment Trends ─────────────────────────────────

// @desc    Enrollment counts over time
// @route   GET /api/analytics/enrollments?startDate=&endDate=&groupBy=month
export const getEnrollmentTrends = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'month' } = req.query;
        const dateRange = buildDateRange(startDate, endDate, 'enrollmentDate');

        const pipeline = [
            { $match: { ...dateRange } },
            {
                $addFields: { _dateField: '$enrollmentDate' }
            },
            {
                $group: {
                    _id: buildDateGroup(groupBy),
                    newEnrollments: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, period: '$_id', newEnrollments: 1 } }
        ];

        const trends = await Enrollment.aggregate(pipeline);
        res.status(200).json(trends);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── 4. Student Attendance Rates ──────────────────────────

// @desc    Attendance percentages (Present/Late/Absent/Excused)
// @route   GET /api/analytics/attendance?sessionId=&startDate=&endDate=
export const getAttendanceStats = async (req, res) => {
    try {
        const { sessionId, startDate, endDate } = req.query;
        const match = {};
        if (sessionId) match.session = sessionId;
        Object.assign(match, buildDateRange(startDate, endDate, 'date'));

        const pipeline = [
            { $match: match },
            { $unwind: '$records' },
            {
                $group: {
                    _id: '$records.status',
                    count: { $sum: 1 }
                }
            }
        ];

        const results = await Attendance.aggregate(pipeline);

        // Convert to percentage breakdown
        const total = results.reduce((sum, r) => sum + r.count, 0);
        const breakdown = {};
        results.forEach(r => {
            breakdown[r._id] = {
                count: r.count,
                percentage: total > 0 ? Math.round((r.count / total) * 10000) / 100 : 0
            };
        });

        res.status(200).json({ total, breakdown });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── 5. Teacher Attendance Rates ──────────────────────────

// @desc    Teacher attendance percentages
// @route   GET /api/analytics/teacher-attendance?teacherId=&startDate=&endDate=
export const getTeacherAttendanceStats = async (req, res) => {
    try {
        const { teacherId, startDate, endDate } = req.query;
        const match = {};
        if (teacherId) match.teacher = teacherId;
        Object.assign(match, buildDateRange(startDate, endDate, 'date'));

        const pipeline = [
            { $match: match },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ];

        const results = await TeacherAttendance.aggregate(pipeline);

        const total = results.reduce((sum, r) => sum + r.count, 0);
        const breakdown = {};
        results.forEach(r => {
            breakdown[r._id] = {
                count: r.count,
                percentage: total > 0 ? Math.round((r.count / total) * 10000) / 100 : 0
            };
        });

        res.status(200).json({ total, breakdown });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── 6. Per-Course Stats ──────────────────────────────────

// @desc    Per-course breakdown: enrollments, revenue, attendance
// @route   GET /api/analytics/courses
export const getCourseStats = async (req, res) => {
    try {
        // Get all courses
        const courses = await Course.find().lean();

        const stats = await Promise.all(courses.map(async (course) => {
            // Find all sessions for this course
            const sessions = await ClassSession.find({ course: course._id }).select('_id').lean();
            const sessionIds = sessions.map(s => s._id);

            // Enrollments count
            const enrollmentCount = await Enrollment.countDocuments({
                session: { $in: sessionIds },
                status: 'Active'
            });

            // Revenue
            const revenueAgg = await Payment.aggregate([
                { $match: { session: { $in: sessionIds }, status: 'Paid' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);

            // Attendance rate
            const attendanceAgg = await Attendance.aggregate([
                { $match: { session: { $in: sessionIds } } },
                { $unwind: '$records' },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        present: {
                            $sum: {
                                $cond: [{ $in: ['$records.status', ['Present', 'Late']] }, 1, 0]
                            }
                        }
                    }
                }
            ]);

            const totalRecords = attendanceAgg.length > 0 ? attendanceAgg[0].total : 0;
            const presentRecords = attendanceAgg.length > 0 ? attendanceAgg[0].present : 0;

            return {
                course: {
                    _id: course._id,
                    title: course.title,
                    language: course.language,
                    level: course.level
                },
                activeSessions: sessions.length,
                activeEnrollments: enrollmentCount,
                totalRevenue: revenueAgg.length > 0 ? revenueAgg[0].total : 0,
                attendanceRate: totalRecords > 0
                    ? Math.round((presentRecords / totalRecords) * 10000) / 100
                    : null
            };
        }));

        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── 7. CSV Export ────────────────────────────────────────

// @desc    Export analytics data as CSV
// @route   GET /api/analytics/export?type=revenue|enrollments&startDate=&endDate=&groupBy=month
export const exportCSV = async (req, res) => {
    try {
        const { type, startDate, endDate, groupBy = 'month' } = req.query;

        let rows = [];
        let headers = '';

        if (type === 'revenue') {
            const dateRange = buildDateRange(startDate, endDate, 'paymentDate');
            const data = await Payment.aggregate([
                { $match: { status: 'Paid', ...dateRange } },
                { $addFields: { _dateField: '$paymentDate' } },
                {
                    $group: {
                        _id: buildDateGroup(groupBy),
                        totalRevenue: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            headers = 'Period,Total Revenue,Payments Count';
            rows = data.map(d => `${d._id},${d.totalRevenue},${d.count}`);
        } else if (type === 'enrollments') {
            const dateRange = buildDateRange(startDate, endDate, 'enrollmentDate');
            const data = await Enrollment.aggregate([
                { $match: { ...dateRange } },
                { $addFields: { _dateField: '$enrollmentDate' } },
                {
                    $group: {
                        _id: buildDateGroup(groupBy),
                        newEnrollments: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            headers = 'Period,New Enrollments';
            rows = data.map(d => `${d._id},${d.newEnrollments}`);
        } else {
            return res.status(400).json({ error: 'Invalid export type. Use "revenue" or "enrollments".' });
        }

        const csv = [headers, ...rows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${type}_report.csv`);
        res.status(200).send(csv);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
