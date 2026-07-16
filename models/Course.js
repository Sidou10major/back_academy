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
    price: { type: Number, min: 0 },
    priceDZD: { type: Number, required: true, min: 0 },
    priceUSD: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

courseSchema.pre('validate', function() {
    if (this.priceDZD === undefined && this.price !== undefined) {
        this.priceDZD = this.price;
    }
    if (this.priceUSD === undefined && this.price !== undefined) {
        this.priceUSD = Math.round(this.price / 135);
    }
});


export default mongoose.model('Course', courseSchema);