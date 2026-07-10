const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
    title: { type: String, required: true },
    schedule: { type: String, required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    capacity: { type: Number, default: 20 }
}, { timestamps: true });

module.exports = mongoose.model('Class', ClassSchema);