import Payroll from '../models/Payroll.js';
import TeacherAttendance from '../models/TeacherAttendance.js';
import User from '../models/User.js';

// Helper to calculate hours from time strings "HH:MM"
const calculateHoursFromTimes = (startTime, endTime) => {
    try {
        const [sh, sm] = startTime.split(':').map(Number);
        const [eh, em] = endTime.split(':').map(Number);
        const diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
        return diffMinutes > 0 ? diffMinutes / 60 : 0;
    } catch {
        return 0;
    }
};

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// @desc    Calculate teacher hours and pay estimation for a date range
// @route   POST /api/payroll/calculate
export const calculateTeacherHoursAndPay = async (req, res) => {
    try {
        const { teacherId, periodStart, periodEnd } = req.body;
        if (!teacherId || !periodStart || !periodEnd) {
            return res.status(400).json({ error: 'teacherId, periodStart, and periodEnd are required' });
        }

        const start = new Date(periodStart);
        const end = new Date(periodEnd);
        end.setHours(23, 59, 59, 999); // include the full end day

        const teacher = await User.findById(teacherId);
        if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

        const rate = teacher.hourlyRate || 25;

        // Fetch Present or Late attendance records in the range
        const attendances = await TeacherAttendance.find({
            teacher: teacherId,
            status: { $in: ['Present', 'Late'] },
            date: { $gte: start, $lte: end }
        }).populate('session');

        let totalHours = 0;
        const details = [];

        for (const att of attendances) {
            if (!att.session) continue;
            
            // Match the day of week of the attendance date
            const attDayName = DAYS_OF_WEEK[new Date(att.date).getDay()];
            const sched = att.session.schedule.find(s => s.day === attDayName);

            let hours = 0;
            if (sched) {
                hours = calculateHoursFromTimes(sched.startTime, sched.endTime);
            } else if (att.session.schedule.length > 0) {
                // Fallback to first schedule slot duration if day matches weirdly
                hours = calculateHoursFromTimes(att.session.schedule[0].startTime, att.session.schedule[0].endTime);
            }

            totalHours += hours;
            details.push({
                attendanceId: att._id,
                date: att.date,
                course: att.session.course,
                status: att.status,
                hours
            });
        }

        const calculatedPay = totalHours * rate;

        res.status(200).json({
            teacherId,
            teacherName: `${teacher.firstName} ${teacher.lastName}`,
            hourlyRate: rate,
            totalHours,
            calculatedPay,
            attendancesCount: attendances.length,
            details
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Create or update payroll sheet
// @route   POST /api/payroll
export const createOrUpdatePayroll = async (req, res) => {
    try {
        const { teacher, periodStart, periodEnd, totalHours, hourlyRate, calculatedPay, remarks } = req.body;
        
        if (!teacher || !periodStart || !periodEnd || totalHours === undefined || !hourlyRate || calculatedPay === undefined) {
            return res.status(400).json({ error: 'All payroll fields are required' });
        }

        const start = new Date(periodStart);
        const end = new Date(periodEnd);

        // Find existing record for this period
        let payroll = await Payroll.findOne({ teacher, periodStart: start, periodEnd: end });

        if (payroll) {
            payroll.totalHours = totalHours;
            payroll.hourlyRate = hourlyRate;
            payroll.calculatedPay = calculatedPay;
            payroll.remarks = remarks || "";
            await payroll.save();
        } else {
            payroll = new Payroll({
                teacher,
                periodStart: start,
                periodEnd: end,
                totalHours,
                hourlyRate,
                calculatedPay,
                remarks: remarks || "",
                status: 'Draft'
            });
            await payroll.save();
        }

        const populated = await Payroll.findById(payroll._id).populate('teacher', 'firstName lastName email');
        res.status(201).json(populated);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Get all payrolls
// @route   GET /api/payroll
export const getAllPayrolls = async (req, res) => {
    try {
        const payrolls = await Payroll.find()
            .populate('teacher', 'firstName lastName email')
            .sort({ createdAt: -1 });
        res.status(200).json(payrolls);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Confirm payment of payroll (Mark as Paid)
// @route   PUT /api/payroll/:id/pay
export const payTeacherPayroll = async (req, res) => {
    try {
        const payroll = await Payroll.findById(req.params.id);
        if (!payroll) return res.status(404).json({ error: 'Payroll record not found' });

        payroll.status = 'Paid';
        payroll.paymentDate = new Date();
        await payroll.save();

        const populated = await Payroll.findById(payroll._id).populate('teacher', 'firstName lastName email');
        res.status(200).json(populated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Delete a payroll record
// @route   DELETE /api/payroll/:id
export const deletePayroll = async (req, res) => {
    try {
        const payroll = await Payroll.findByIdAndDelete(req.params.id);
        if (!payroll) return res.status(404).json({ error: 'Payroll record not found' });
        res.status(200).json({ message: 'Payroll record deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
