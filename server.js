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
// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Language Academy Server running on port ${PORT}`);
});