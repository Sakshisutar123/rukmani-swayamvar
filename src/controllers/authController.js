import User from '../models/User.js';
import bcrypt from 'bcrypt';
import otpGenerator from 'otp-generator';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Validate email configuration
if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
  console.error('❌ Email configuration missing!');
  console.error('💡 MAIL_USER:', process.env.MAIL_USER ? '✅ Set' : '❌ Missing');
  console.error('💡 MAIL_PASS:', process.env.MAIL_PASS ? '✅ Set' : '❌ Missing');
  console.error('💡 Create .env file in root directory with MAIL_USER and MAIL_PASS');
}

// Check password length (App Password should be 16 characters)
const passLength = process.env.MAIL_PASS?.length || 0;
if (process.env.MAIL_PASS && passLength !== 16) {
  console.warn('⚠️  WARNING: MAIL_PASS length is', passLength, '(should be 16 for App Password)');
  console.warn('💡 App Passwords are exactly 16 characters with NO spaces');
  console.warn('💡 If you copied it with spaces, remove them: "abcd efgh ijkl mnop" → "abcdefghijklmnop"');
}

// Send mail setup
// Using direct SMTP instead of 'service: gmail' for better compatibility with cloud hosting
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000,
  // Retry configuration
  pool: true,
  maxConnections: 1,
  maxMessages: 3,
});

// Verify transporter configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log('❌ Email transporter error:', error.message);
    console.log('💡 MAIL_USER:', process.env.MAIL_USER || 'NOT SET');
    console.log('💡 MAIL_PASS length:', passLength, passLength === 16 ? '✅' : '❌ (should be 16)');
    
    if (error.message.includes('Invalid login') || error.message.includes('BadCredentials')) {
      console.log('');
      console.log('🔴 GMAIL AUTHENTICATION FAILED');

    }
  } else {
    console.log('✅ Email transporter ready');
    console.log('📧 Using email:', process.env.MAIL_USER);
  }
});

// 1️⃣ Check if user exists
export const checkUser = async (req, res) => {
  try {
    const { uniqueId } = req.body;
    const user = await User.findOne({ where: { uniqueId } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isRegistered) return res.status(400).json({ message: 'User already registered' });

    res.json({ message: 'User found', email: user.email });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// 2️⃣ Send OTP
export const sendOtp = async (req, res) => {
  try {
    const { uniqueId } = req.body;
    const user = await User.findOne({ where: { uniqueId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Check if email is configured
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      return res.status(500).json({ 
        message: 'Email configuration error', 
        error: 'MAIL_USER or MAIL_PASS not set in .env file. Please configure email settings.' 
      });
    }

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: user.email,
      subject: 'OTP Verification',
      text: `Your OTP for registration is: ${otp}. It will expire in 5 minutes.`,
    });

    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    // Provide more helpful error messages
    let errorMessage = err.message;
    if (err.message.includes('Invalid login') || err.message.includes('BadCredentials')) {
      errorMessage = 'Gmail authentication failed. Make sure you are using App Password (not regular password). See GMAIL_SETUP.md for instructions.';
    }
    res.status(500).json({ 
      message: 'Error sending OTP', 
      error: errorMessage,
      hint: 'Check GMAIL_SETUP.md for Gmail App Password setup instructions'
    });
  }
};

// 3️⃣ Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { uniqueId, otp } = req.body;
    const user = await User.findOne({ where: { uniqueId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (new Date() > user.otpExpiry) return res.status(400).json({ message: 'OTP expired' });

    res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// 4️⃣ Set Password
export const setPassword = async (req, res) => {
  try {
    const { uniqueId, password } = req.body;
    const user = await User.findOne({ where: { uniqueId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.isRegistered = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: 'Password created successfully, registration complete' });
  } catch (err) {
    res.status(500).json({ message: 'Error setting password', error: err.message });
  }

  
};
// Test Email Configuration
export const testEmailConfig = async (req, res) => {
  try {
    const config = {
      mailUser: process.env.MAIL_USER || 'NOT SET',
      mailPass: process.env.MAIL_PASS ? '***SET***' : 'NOT SET',
      mailUserLength: process.env.MAIL_USER?.length || 0,
      mailPassLength: process.env.MAIL_PASS?.length || 0,
    };

    // Test transporter connection
    await transporter.verify();
    
    res.json({
      message: 'Email configuration is valid',
      config: {
        email: config.mailUser,
        passwordSet: !!process.env.MAIL_PASS,
        passwordLength: config.mailPassLength,
      },
      status: 'ready'
    });
  } catch (err) {
    const config = {
      mailUser: process.env.MAIL_USER || 'NOT SET',
      mailPass: process.env.MAIL_PASS ? '***SET***' : 'NOT SET',
      mailUserLength: process.env.MAIL_USER?.length || 0,
      mailPassLength: process.env.MAIL_PASS?.length || 0,
    };

    let errorMessage = err.message;
    let hint = '';
    
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      errorMessage = 'Email configuration missing in .env file';
      hint = 'Create .env file with MAIL_USER and MAIL_PASS';
    } else if (err.message.includes('Invalid login') || err.message.includes('BadCredentials')) {
      errorMessage = 'Gmail authentication failed';
      hint = 'Use App Password (not regular password). See GMAIL_SETUP.md';
    } else if (config.mailPassLength !== 16) {
      errorMessage = 'App Password should be 16 characters';
      hint = 'Make sure you copied the full 16-character App Password (no spaces)';
    }

    res.status(500).json({
      message: 'Email configuration error',
      error: errorMessage,
      hint: hint,
      config: {
        email: config.mailUser,
        passwordSet: !!process.env.MAIL_PASS,
        passwordLength: config.mailPassLength,
        expectedLength: 16,
      }
    });
  }
};

// 5️⃣ Login
export const loginUser = async (req, res) => {
  try {
    const { uniqueId, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ where: { uniqueId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

    // Generate JWT
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { id: user.id, uniqueId: user.uniqueId },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        uniqueId: user.uniqueId,
        fullName: user.fullName,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
