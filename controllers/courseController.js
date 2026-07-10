import Course from '../models/Course.js';

// @desc    Create a new language course
// @route   POST /api/courses
export const createCourse = async (req, res) => {
    try {
        const course = new Course(req.body);
        await course.save();
        res.status(201).json(course);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Get all courses (with optional filters for language and level)
// @route   GET /api/courses?language=German&level=B1 (Intermediate)
export const getCourses = async (req, res) => {
    try {
        const { language, level } = req.query;
        let query = { isActive: true };

        if (language) query.language = language;
        if (level) query.level = level;

        const courses = await Course.find(query);
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Update a course
// @route   PUT /api/courses/:id
export const updateCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!course) return res.status(404).json({ error: 'Course not found' });
        res.status(200).json(course);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Delete a course
// @route   DELETE /api/courses/:id
export const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) return res.status(404).json({ error: 'Course not found' });
        res.status(200).json({ message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};