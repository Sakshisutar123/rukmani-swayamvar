import User from '../models/User.js';
import bcrypt from 'bcrypt';
import otpGenerator from 'otp-generator';
import dotenv from 'dotenv';
dotenv.config();

/* ----------------------- MAILERSEND (API EMAIL) ----------------------- */
import { MailerSend, EmailParams, Sender } from "mailersend";

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

const sentFrom = new Sender(
  process.env.MAIL_FROM,
  process.env.MAIL_FROM_NAME || "DCS Coaching"
);

async function sendEmail(to, subject, html) {
  try {
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo([{ email: to }])
      .setSubject(subject)
      .setHtml(html);

    await mailerSend.email.send(emailParams);
    console.log("📧 MailerSend email sent!");
    return true;
  } catch (err) {
    console.error("❌ MailerSend error:", err.message);
    return false;
  }
}

/* ---------------------------- 1️⃣ CHECK USER ---------------------------- */
export const checkUser = async (req, res) => {
  try {
    const { uniqueId } = req.body;
    const user = await User.findOne({ where: { uniqueId } });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isRegistered)
      return res.status(400).json({ message: 'User already registered' });

    res.json({ message: 'User found', email: user.email });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/* ---------------------------- 2️⃣ SEND OTP ---------------------------- */
export const sendOtp = async (req, res) => {
  try {
    const { uniqueId } = req.body;
    const user = await User.findOne({ where: { uniqueId } });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
    });

    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    const emailSent = await sendEmail(
      user.email,
      "OTP Verification",
      `<p>Your OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`
    );

    if (!emailSent) {
      return res.status(500).json({
        message: "Failed to send OTP",
        error: "MailerSend API error",
      });
    }

    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    res.status(500).json({
      message: "Error sending OTP",
      error: err.message,
    });
  }
};

/* ---------------------------- 3️⃣ VERIFY OTP ---------------------------- */
export const verifyOtp = async (req, res) => {
  try {
    const { uniqueId, otp } = req.body;
    const user = await User.findOne({ where: { uniqueId } });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (new Date() > user.otpExpiry)
      return res.status(400).json({ message: 'OTP expired' });

    res.json({ message: 'OTP verified successfully' });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/* ---------------------------- 4️⃣ SET PASSWORD ---------------------------- */
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

/* ---------------------------- 5️⃣ TEST EMAIL CONFIG ---------------------------- */
export const testEmailConfig = async (req, res) => {
  try {
    if (!process.env.MAILERSEND_API_KEY) {
      return res.status(400).json({
        message: "MailerSend key missing",
        error: "Add MAILERSEND_API_KEY in .env",
      });
    }

    const test = await sendEmail(
      process.env.MAIL_FROM,
      "MailerSend Test Email",
      "<p>Your MailerSend integration works!</p>"
    );

    if (!test) {
      return res.status(500).json({
        message: "MailerSend test failed",
      });
    }

    res.json({
      message: "MailerSend configuration valid",
      email: process.env.MAIL_FROM,
      status: "ready",
    });

  } catch (err) {
    res.status(500).json({
      message: "Email config error",
      error: err.message,
    });
  }
};

/* ---------------------------- 6️⃣ LOGIN ---------------------------- */
export const loginUser = async (req, res) => {
  try {
    const { uniqueId, password } = req.body;
    const user = await User.findOne({ where: { uniqueId } });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

    const jwt = await import("jsonwebtoken");
    const token = jwt.default.sign(
      { id: user.id, uniqueId: user.uniqueId },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        uniqueId: user.uniqueId,
        fullName: user.fullName,
      }
    });

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
