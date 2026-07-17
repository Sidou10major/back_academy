import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClassSession',
        required: true
    },
    title: { type: String, required: true, trim: true },
    type: {
        type: String,
        enum: ['Syllabus', 'Homework', 'Reading', 'Other'],
        default: 'Reading'
    },
    url: { type: String, required: true, trim: true }, // Document link (e.g. local upload path or Google Drive/Dropbox URL)
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    originalName: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    fileSize: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Material', materialSchema);
