import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Import Models
import User from '../models/User.js';
import Course from '../models/Course.js';
import ClassSession from '../models/ClassSession.js';
import TeacherLeave from '../models/TeacherLeave.js';
import TeacherAvailability from '../models/TeacherAvailability.js';
import Grade from '../models/Grade.js';
import Material from '../models/Material.js';

// Import Controller functions directly to test logic
import { createUser, loginUser, unblockUser, blockUser, getUsers } from '../controllers/userController.js';
import { getAllLeaves, handleLeaveStatus, requestLeave, saveAvailability, getAllAvailabilities } from '../controllers/teacherPortalController.js';
import { createGrade, getAllGrades } from '../controllers/gradeController.js';
import { createMaterial, getSessionMaterials } from '../controllers/materialController.js';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/simple_academy';

async function runTests() {
    console.log('🔄 Connecting to MongoDB...');
    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB.');
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    }

    // Helper to mock Express Request and Response
    const mockRes = () => {
        const res = {};
        res.status = (code) => {
            res.statusCode = code;
            return res;
        };
        res.json = (data) => {
            res.jsonData = data;
            return res;
        };
        return res;
    };

    let adminUser, teacherUser, studentUser, testCourse, testSession, testLeave, testMaterial;

    try {
        console.log('\n--- 1. Set Up Mock Data ---');
        // Delete any old test users
        await User.deleteMany({ email: /@test\.com$/ });
        await Course.deleteMany({ title: /Test Course/ });
        await ClassSession.deleteMany({});
        await TeacherLeave.deleteMany({});
        await TeacherAvailability.deleteMany({});
        await Grade.deleteMany({});
        await Material.deleteMany({});

        // Create Users
        adminUser = await User.create({
            firstName: 'Test',
            lastName: 'Admin',
            email: 'admin@test.com',
            password: 'password123',
            role: 'admin'
        });
        teacherUser = await User.create({
            firstName: 'Test',
            lastName: 'Teacher',
            email: 'teacher@test.com',
            password: 'password123',
            role: 'teacher'
        });
        studentUser = await User.create({
            firstName: 'Test',
            lastName: 'Student',
            email: 'student@test.com',
            password: 'password123',
            role: 'student'
        });
        console.log('✅ Mock users created.');

        // Create Course and Session
        testCourse = await Course.create({
            title: 'Test Course 101',
            language: 'English',
            level: 'A1 (Beginner)',
            format: 'Group Class',
            price: 5000,
            description: 'A test course.'
        });
        testSession = await ClassSession.create({
            course: testCourse._id,
            teacher: teacherUser._id,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            maxStudents: 10,
            schedule: [{ day: 'Monday', startTime: '10:00', endTime: '11:30' }]
        });
        console.log('✅ Mock Course and Session created.');

        console.log('\n--- 2. Testing Block & Unblock Functionality ---');
        // Check initial active status
        console.log(`Initial Student status: isActive = ${studentUser.isActive}`);

        // Block Student
        let req = { params: { id: studentUser._id.toString() } };
        let res = mockRes();
        await blockUser(req, res);
        console.log(`Block Response Status: ${res.statusCode}`);
        console.log('Block Message:', res.jsonData.message);
        
        let blockedStudent = await User.findById(studentUser._id);
        console.log(`Status after block: isActive = ${blockedStudent.isActive}`);
        if (blockedStudent.isActive !== false) throw new Error('Student should be inactive.');

        // Test login of blocked user
        req = { body: { email: 'student@test.com', password: 'password123' } };
        res = mockRes();
        await loginUser(req, res);
        console.log(`Login Blocked User Status (expected 403): ${res.statusCode}`);
        console.log('Login Blocked User Response:', res.jsonData.error);
        if (res.statusCode !== 403) throw new Error('Blocked user should not log in.');

        // Unblock Student
        req = { params: { id: studentUser._id.toString() } };
        res = mockRes();
        await unblockUser(req, res);
        console.log(`Unblock Response Status: ${res.statusCode}`);
        console.log('Unblock Message:', res.jsonData.message);

        let unblockedStudent = await User.findById(studentUser._id);
        console.log(`Status after unblock: isActive = ${unblockedStudent.isActive}`);
        if (unblockedStudent.isActive !== true) throw new Error('Student should be active.');

        // Test login after unblocking
        req = { body: { email: 'student@test.com', password: 'password123' } };
        res = mockRes();
        await loginUser(req, res);
        console.log(`Login Active User Status (expected 200): ${res.statusCode}`);
        if (res.statusCode !== 200) throw new Error('Unblocked user should be able to log in.');

        console.log('\n--- 3. Testing Leaves & Availabilities (Admin Portal) ---');
        // Submit Availability
        req = {
            body: {
                teacher: teacherUser._id.toString(),
                slots: [
                    { day: 'Monday', startTime: '09:00', endTime: '12:00' },
                    { day: 'Wednesday', startTime: '14:00', endTime: '16:00' }
                ]
            }
        };
        res = mockRes();
        await saveAvailability(req, res);
        console.log('Availability saved:', res.jsonData.slots);

        // Get All Availabilities (Admin View)
        req = {};
        res = mockRes();
        await getAllAvailabilities(req, res);
        console.log('All Availabilities retrieved count:', res.jsonData.length);
        if (res.jsonData.length === 0) throw new Error('No availabilities found.');
        console.log('Teacher in Availability record:', res.jsonData[0].teacher.firstName);

        // Submit Leave Request
        req = {
            body: {
                teacher: teacherUser._id.toString(),
                startDate: new Date(),
                endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                reason: 'Family event'
            }
        };
        res = mockRes();
        await requestLeave(req, res);
        testLeave = res.jsonData;
        console.log('Leave requested. ID:', testLeave._id, 'Status:', testLeave.status);

        // Get All Leaves (Admin View) - unfiltered
        req = { query: {} };
        res = mockRes();
        await getAllLeaves(req, res);
        console.log('All Leaves count (unfiltered):', res.jsonData.length);

        // Get All Leaves (Admin View) - filtered by Pending
        req = { query: { status: 'Pending' } };
        res = mockRes();
        await getAllLeaves(req, res);
        console.log('Pending Leaves count:', res.jsonData.length);
        if (res.jsonData.length === 0) throw new Error('Pending leave request not found.');

        // Get All Leaves (Admin View) - filtered by Approved (should be 0)
        req = { query: { status: 'Approved' } };
        res = mockRes();
        await getAllLeaves(req, res);
        console.log('Approved Leaves count (expected 0):', res.jsonData.length);

        // Handle Leave Status (Approve it)
        req = {
            params: { leaveId: testLeave._id.toString() },
            body: {
                status: 'Approved',
                remarks: 'Approved by admin',
                adminId: adminUser._id.toString()
            }
        };
        res = mockRes();
        await handleLeaveStatus(req, res);
        console.log('Leave handle status code:', res.statusCode);
        console.log('Updated Leave status:', res.jsonData.status);
        if (res.jsonData.status !== 'Approved') throw new Error('Leave status was not updated to Approved.');

        console.log('\n--- 4. Testing Admin Grades Checking ---');
        // Record a Grade
        req = {
            body: {
                student: studentUser._id.toString(),
                session: testSession._id.toString(),
                teacher: teacherUser._id.toString(),
                type: 'exam',
                title: 'Final Exam',
                score: 85,
                maxScore: 100,
                weight: 2,
                date: new Date()
            }
        };
        res = mockRes();
        await createGrade(req, res);
        console.log('Grade created score:', res.jsonData.score);

        // Check grades as Admin (All grades query)
        req = { query: {} };
        res = mockRes();
        await getAllGrades(req, res);
        console.log('All Grades retrieved count:', res.jsonData.length);
        if (res.jsonData.length === 0) throw new Error('No grades found in global query.');

        // Check grades filtered by student
        req = { query: { student: studentUser._id.toString() } };
        res = mockRes();
        await getAllGrades(req, res);
        console.log(`Grades filtered by student ID: count = ${res.jsonData.length}`);
        if (res.jsonData.length === 0) throw new Error('No student-specific grades found.');
        console.log('Student Name in populated grade:', res.jsonData[0].student.firstName);

        console.log('\n--- 5. Testing Resource Sharing (PDF/PPTX) ---');
        // Test Material link/URL fallback sharing
        req = {
            body: {
                session: testSession._id.toString(),
                title: 'Course Syllabus PDF',
                type: 'Syllabus',
                url: 'https://example.com/syllabus.pdf',
                uploadedBy: teacherUser._id.toString()
            }
        };
        res = mockRes();
        await createMaterial(req, res);
        console.log('Material created via URL sharing:', res.jsonData.title);
        console.log('Uploader name:', res.jsonData.uploadedBy.firstName);

        // Test mock file upload (Multer simulation)
        const mockFile = {
            filename: 'test_slide_deck_123.pptx',
            originalname: 'IntroToEnglish.pptx',
            mimetype: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            size: 452093
        };
        req = {
            body: {
                session: testSession._id.toString(),
                title: 'Introduction Slide Deck PPTX',
                type: 'Reading',
                uploadedBy: adminUser._id.toString()
            },
            file: mockFile
        };
        res = mockRes();
        await createMaterial(req, res);
        testMaterial = res.jsonData;
        console.log('Material created via File Upload mock:', testMaterial.title);
        console.log('Saved URL:', testMaterial.url);
        console.log('Original File Name:', testMaterial.originalName);
        console.log('MimeType:', testMaterial.mimeType);
        console.log('Uploader role:', testMaterial.uploadedBy.role);
        if (testMaterial.originalName !== 'IntroToEnglish.pptx') throw new Error('Original name mismatch');
        if (testMaterial.url !== '/uploads/test_slide_deck_123.pptx') throw new Error('File path/URL mismatch');

        // Fetch materials for session (simulating Student viewing session materials)
        req = { params: { sessionId: testSession._id.toString() } };
        res = mockRes();
        await getSessionMaterials(req, res);
        console.log('Session materials fetched count:', res.jsonData.length);
        if (res.jsonData.length !== 2) throw new Error('Expected 2 materials.');

        console.log('\n--- Cleanup test data ---');
        await User.deleteMany({ email: /@test\.com$/ });
        await Course.deleteMany({ title: /Test Course/ });
        await ClassSession.deleteMany({});
        await TeacherLeave.deleteMany({});
        await TeacherAvailability.deleteMany({});
        await Grade.deleteMany({});
        await Material.deleteMany({});
        console.log('✅ Clean up complete.');

        console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
        process.exit(0);
    } catch (error) {
        console.error('❌ Test failed with error:', error);
        process.exit(1);
    }
}

runTests();
