const User = require('../models/User');
const VerificationCode = require('../models/VerificationCode');
const { sendVerificationEmail } = require('../utils/email');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Helper: Generate random 6-digit code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already in use.' });

    const user = new User({ 
      username: name, // Using name as username
      email, 
      password 
    });
    await user.save();

    // Generate and save verification code
    const code = generateCode();
    await VerificationCode.findOneAndUpdate(
      { email },
      { code, expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
      { upsert: true }
    );

    // Send verification email
    try {
      await sendVerificationEmail(email, code);
      res.status(201).json({ message: 'Account created. Please check your email for the verification code.' });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      res.status(201).json({ 
        message: 'Account created but verification email could not be sent. Please contact support.',
        code: code // Sending code in response for testing
      });
    }
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    const record = await VerificationCode.findOne({ email, code });
    if (!record || record.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired verification code.' });
    }
    await User.findOneAndUpdate({ email }, { isEmailVerified: true });
    await VerificationCode.deleteOne({ email });
    res.json({ message: 'Email verified successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid login credentials.' });
    if (!user.isEmailVerified) return res.status(403).json({ message: 'Please verify your email first.' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid login credentials.' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 