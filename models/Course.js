import mongoose from 'mongoose';

const languageEnum = ['Arabic', 'Darija', 'French', 'English', 'German', 'Spanish', 'Italian', 'Chinese'];
const levelEnum = ['A1 (Beginner)', 'A2 (Elementary)', 'B1 (Intermediate)', 'B2 (Upper Intermediate)', 'C1 (Advanced)', 'C2 (Mastery)'];

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    language: {
        type: String,
        enum: languageEnum,
        required: true
    },
    level: {
        type: String,
        enum: levelEnum,
        required: true
    },
    format: {
        type: String,
        enum: ['1-on-1', 'Group Class'],
        required: true
    },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);