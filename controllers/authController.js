const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                status: false,
                message: "This email address is already registered." 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            username,
            email,
            password: hashedPassword
        });

        // تم التوحيد هنا: استخدام id بدلاً من userId لمنع التضارب الكارثي
        const token = jwt.sign(
            { id: newUser._id }, 
            process.env.JWT_SECRET || 'YOUR_JWT_SECRET', 
            { expiresIn: '300d' } 
        );

        // استجابة النجاح الخاصة بك كما هي دون تعديل هيكلي
        res.status(201).json({
            status: true,
            message: "User has successfully signed up",
            token: token,
            user: {
                _id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                avatar: newUser.avatar || "",
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                status: false,
                message: "This email address is already in use."
            });
        }
        res.status(500).json({ 
            status: false,
            message: "An unexpected error occurred during signup. Please try again." 
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ 
                status: false,
                message: "This user is not registered yet." 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ 
                status: false,
                message: "Incorrect password. Please try again." 
            });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'YOUR_JWT_SECRET', { expiresIn: '700d' });

        // استجابة النجاح الخاصة بك كما هي دون تعديل هيكلي
        res.status(200).json({ message: "log in has successfully done", token, id: user._id });
    } catch (error) {
        res.status(500).json({ 
            status: false,
            message: "An unexpected error occurred during login. Please try again." 
        });
    }
};