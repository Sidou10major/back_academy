const Class = require('../models/Class');

const createClass = async (req, res) => {
    try {
        const newClass = new Class(req.body);
        await newClass.save();
        res.status(201).json(newClass);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getClasses = async (req, res) => {
    try {
        const classes = await Class.find().populate('teacher', 'name email');
        res.json(classes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteClass = async (req, res) => {
    try {
        const targetClass = await Class.findById(req.params.id);
        if (!targetClass) return res.status(404).json({ error: 'Class not found' });

        await targetClass.deleteOne();
        res.json({ message: 'Class deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { createClass, getClasses, deleteClass };