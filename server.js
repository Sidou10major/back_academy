import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

// Import Routes
import userRoutes from './routes/userRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import classSessionRoutes from './routes/classSessionRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import teacherAttendanceRoutes from './routes/teacherAttendanceRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import gradeRoutes from './routes/gradeRoutes.js';
import skillAssessmentRoutes from './routes/skillAssessmentRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import teacherPortalRoutes from './routes/teacherPortalRoutes.js';
import payrollRoutes from './routes/payrollRoutes.js';
import placementTestRoutes from './routes/placementTestRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/simple_academy')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Mount Routes
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/sessions', classSessionRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/teacher-attendance', teacherAttendanceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/skill-assessments', skillAssessmentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/teacher-portal', teacherPortalRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/placement-tests', placementTestRoutes);
app.use('/api/materials', materialRoutes);
// Start Server
const PORT = process.env.PORT || 5000;
import { startAlertService } from './services/alertService.js';

app.listen(PORT, () => {
    console.log(`🚀 Language Academy Server running on port ${PORT}`);
    startAlertService();
});