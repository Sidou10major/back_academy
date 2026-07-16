import Certificate from '../models/Certificate.js';
import Enrollment from '../models/Enrollment.js';
import crypto from 'crypto';

// @desc    Issue a completion certificate
// @route   POST /api/certificates
export const issueCertificate = async (req, res) => {
    try {
        const { student, enrollment, course } = req.body;
        if (!student || !enrollment || !course) {
            return res.status(400).json({ error: 'student, enrollment, and course are required.' });
        }

        // Check if certificate already issued
        const existing = await Certificate.findOne({ student, course });
        if (existing) {
            return res.status(400).json({ error: 'A certificate has already been issued to this student for this course.' });
        }

        // Generate unique certificate hash number
        const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
        const certificateNumber = `ISI-${Date.now().toString().substring(7)}-${randomHex}`;

        const certificate = new Certificate({
            student,
            enrollment,
            course,
            certificateNumber
        });
        await certificate.save();

        // Populate details
        const populated = await Certificate.findById(certificate._id)
            .populate('student', 'firstName lastName email')
            .populate('course', 'title language level')
            .populate({
                path: 'enrollment',
                populate: { path: 'session' }
            });

        res.status(201).json(populated);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Get certificates for a specific student
// @route   GET /api/certificates/student/:studentId
export const getStudentCertificates = async (req, res) => {
    try {
        const certificates = await Certificate.find({ student: req.params.studentId })
            .populate('course', 'title language level')
            .populate({
                path: 'enrollment',
                populate: { path: 'session', populate: { path: 'teacher', select: 'firstName lastName' } }
            })
            .sort({ issueDate: -1 });

        res.status(200).json(certificates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get all certificates (Admin usage)
// @route   GET /api/certificates
export const getAllCertificates = async (req, res) => {
    try {
        const certificates = await Certificate.find()
            .populate('student', 'firstName lastName email')
            .populate('course', 'title language level')
            .populate({
                path: 'enrollment',
                populate: { path: 'session' }
            })
            .sort({ issueDate: -1 });

        res.status(200).json(certificates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get a certificate by MongoDB _id (Direct view)
// @route   GET /api/certificates/:id
export const getCertificateById = async (req, res) => {
    try {
        const certificate = await Certificate.findById(req.params.id)
            .populate('student', 'firstName lastName email')
            .populate('course', 'title language level price priceDZD priceUSD format')
            .populate({
                path: 'enrollment',
                populate: { path: 'session', populate: { path: 'teacher', select: 'firstName lastName' } }
            });

        if (!certificate) {
            return res.status(404).json({ error: 'Certificate not found.' });
        }

        res.status(200).json(certificate);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Revoke certificate
// @route   DELETE /api/certificates/:id
export const revokeCertificate = async (req, res) => {
    try {
        const certificate = await Certificate.findByIdAndDelete(req.params.id);
        if (!certificate) {
            return res.status(404).json({ error: 'Certificate not found.' });
        }
        res.status(200).json({ message: 'Certificate revoked successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
