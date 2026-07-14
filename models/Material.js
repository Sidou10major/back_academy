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
    url: { type: String, required: true, trim: true } // Document link (e.g. Google Drive/Dropbox URL)
}, { timestamps: true });

export default mongoose.model('Material', materialSchema);
