import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const languageEnum = ['Arabic', 'Darija', 'French', 'English', 'German', 'Spanish', 'Italian', 'Chinese'];

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['admin', 'teacher', 'student'],
        default: 'student'
    },
    languages: [{
        type: String,
        enum: languageEnum
    }],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Pre-save hook to hash the password before saving to the database
// Pre-save hook to hash the password before saving to the database
userSchema.pre('save', async function () {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return;

    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with the hashed password in the database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);