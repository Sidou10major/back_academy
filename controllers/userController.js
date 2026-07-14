import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Helper function to generate JWT
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '30d', // Token expires in 30 days
        }
    );
};

// @desc    Auth user & get token (Login)
// @route   POST /api/users/login
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email });

        // Verify user exists, password matches, and account is active
        if (user && (await user.matchPassword(password))) {
            if (!user.isActive) {
                return res.status(403).json({ error: 'Your account has been blocked. Please contact administration.' });
            }

            res.status(200).json({
                _id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                phone: user.phone,
                token: generateToken(user)
            });
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// @desc    Create a new user (Student, Teacher, or Admin)
// @route   POST /api/users
export const createUser = async (req, res) => {
    try {
        // In a real app, we would hash the password here with bcrypt
        const user = new User(req.body);
        await user.save();

        // Don't send the password back in the response
        user.password = undefined;
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Get all users (with optional filters for role and language)
// @route   GET /api/users?role=teacher&language=Spanish
export const getUsers = async (req, res) => {
    try {
        const { role, language } = req.query;
        let query = {}; // Return all users by default (active and inactive) so admin can see and toggle status

        if (role) query.role = role;
        if (language) query.languages = language;

        const users = await User.find(query).select('-password'); // Exclude passwords
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Update a user
// @route   PUT /api/users/:id
export const updateUser = async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Update fields
        user.firstName = req.body.firstName !== undefined ? req.body.firstName : user.firstName;
        user.lastName = req.body.lastName !== undefined ? req.body.lastName : user.lastName;
        user.email = req.body.email !== undefined ? req.body.email : user.email;
        user.role = req.body.role !== undefined ? req.body.role : user.role;
        user.languages = req.body.languages !== undefined ? req.body.languages : user.languages;
        user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
        user.hourlyRate = req.body.hourlyRate !== undefined ? req.body.hourlyRate : user.hourlyRate;
        user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;

        if (password) {
            user.password = password;
        }

        await user.save();
        
        // Hide password in response
        const updatedUser = user.toObject();
        delete updatedUser.password;

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};