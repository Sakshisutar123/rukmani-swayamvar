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

// Validate MAIL_FROM is set and is an email
const mailFrom = process.env.MAIL_FROM;
const mailFromName = process.env.MAIL_FROM_NAME || "DCS Coaching";

if (!mailFrom) {
  console.error("❌ MAIL_FROM environment variable is not set!");
} else if (!mailFrom.includes('@')) {
  console.error("⚠️  WARNING: MAIL_FROM should be an email address, not a name!");
  console.error("⚠️  Current value:", mailFrom);
  console.error("⚠️  Example: MAIL_FROM=noreply@yourdomain.com");
}

let sentFrom = null;
try {
  if (mailFrom && mailFrom.includes('@')) {
    sentFrom = new Sender(mailFrom, mailFromName);
    console.log("✅ Sender created:", mailFrom, mailFromName);
  }
} catch (err) {
  console.error("❌ Error creating Sender:", err);
}

async function sendEmail(to, subject, html) {
  try {
    // Validate email configuration
    if (!process.env.MAILERSEND_API_KEY) {
      console.error("❌ MAILERSEND_API_KEY not set");
      return false;
    }
    
    if (!process.env.MAIL_FROM) {
      console.error("❌ MAIL_FROM not set");
      return false;
    }
    
    // Validate MAIL_FROM is an email, not a name
    if (!process.env.MAIL_FROM.includes('@')) {
      console.error("❌ MAIL_FROM must be an email address, not a name:", process.env.MAIL_FROM);
      return false;
    }
    
    if (!to || !to.includes('@')) {
      console.error("❌ Invalid recipient email:", to);
      return false;
    }

    if (!sentFrom) {
      console.error("❌ Sender object is not initialized. Check MAIL_FROM configuration.");
      return false;
    }

    console.log("📤 Preparing to send email:", {
      from: mailFrom,
      fromName: mailFromName,
      to: to,
      subject: subject
    });

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo([{ email: to }])
      .setSubject(subject)
      .setHtml(html);

    console.log("📤 Sending email via MailerSend...");
    const result = await mailerSend.email.send(emailParams);
    console.log("📧 MailerSend email sent successfully to:", to);
    console.log("📧 MailerSend response:", result);
    return true;
  } catch (err) {
    // Better error logging for MailerSend - handle different error structures
    let errorMessage = 'Unknown error';
    let errorStatus = null;
    let errorData = null;
    
    // Try different ways to extract error info
    if (err.message) {
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      errorMessage = err;
    } else if (err.toString && err.toString() !== '[object Object]') {
      errorMessage = err.toString();
    }
    
    // Try to get status code
    if (err.statusCode) {
      errorStatus = err.statusCode;
    } else if (err.status) {
      errorStatus = err.status;
    } else if (err.response?.status) {
      errorStatus = err.response.status;
    } else if (err.response?.statusCode) {
      errorStatus = err.response.statusCode;
    }
    
    // Try to get error data/body
    if (err.body) {
      errorData = err.body;
    } else if (err.data) {
      errorData = err.data;
    } else if (err.response?.data) {
      errorData = err.response.data;
    } else if (err.response?.body) {
      errorData = err.response.body;
    }
    
    const errorDetails = {
      message: errorMessage,
      name: err.name || 'Error',
      status: errorStatus,
      statusText: err.response?.statusText,
      data: errorData,
      errorType: err.constructor?.name,
      to: to,
      from: process.env.MAIL_FROM,
      fromName: process.env.MAIL_FROM_NAME,
      // Log the entire error structure
      fullError: JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
    };
    
    console.error("❌ MailerSend error details:", JSON.stringify(errorDetails, null, 2));
    console.error("❌ Raw error object:", err);
    console.error("❌ Error keys:", Object.keys(err || {}));
    
    return false;
  }
}

/* ---------------------------- 1️⃣ CHECK USER ---------------------------- */
export const checkUser = async (req, res) => {
  try {
    const { uniqueId } = req.body;
    
    // Check if table exists first
    const tableExists = await User.sequelize.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      )`,
      { type: User.sequelize.QueryTypes.SELECT }
    );
    
    if (!tableExists[0]?.exists) {
      return res.status(500).json({ 
        message: 'Database table missing', 
        error: 'Users table does not exist. Please run migrations or create the table.',
        hint: 'Run: CREATE TABLE users (...) or set SYNC_DB=true in environment variables'
      });
    }
    
    const user = await User.findOne({ where: { uniqueId } });

    if (!user) {
      // Check if any users exist
      const userCount = await User.count();
      return res.status(404).json({ 
        message: 'User not found',
        debug: {
          searchedUniqueId: uniqueId,
          totalUsersInDatabase: userCount,
          hint: userCount === 0 ? 'No users in database. Add a user first.' : `User with uniqueId "${uniqueId}" does not exist.`
        }
      });
    }
    
    if (user.isRegistered)
      return res.status(400).json({ message: 'User already registered' });

    res.json({ message: 'User found', email: user.email });
  } catch (err) {
    console.error('Check user error:', err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
  }
};

/* ---------------------------- 2️⃣ SEND OTP ---------------------------- */
export const sendOtp = async (req, res) => {
  try {
    const { uniqueId } = req.body;
    
    if (!uniqueId) {
      return res.status(400).json({ message: 'uniqueId is required' });
    }
    
    const user = await User.findOne({ where: { uniqueId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has email
    if (!user.email) {
      return res.status(400).json({ 
        message: 'User email not found',
        error: 'User does not have an email address configured'
      });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
    });

    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    console.log(`📤 Attempting to send OTP to: ${user.email}`);

    const emailSent = await sendEmail(
      user.email,
      "OTP Verification",
      `<p>Your OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`
    );

    if (!emailSent) {
      // Check environment variables
      const envCheck = {
        MAILERSEND_API_KEY: process.env.MAILERSEND_API_KEY ? '✅ Set' : '❌ Missing',
        MAIL_FROM: process.env.MAIL_FROM || '❌ Missing',
        MAIL_FROM_IS_EMAIL: process.env.MAIL_FROM?.includes('@') ? '✅ Valid' : '❌ Invalid (must be email address)',
        MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || 'Not set (optional)',
        userEmail: user.email || '❌ Missing'
      };

      // Check if it's a domain verification error
      const isDomainError = process.env.MAIL_FROM?.includes('gmail.com') || 
                            process.env.MAIL_FROM?.includes('yahoo.com') ||
                            process.env.MAIL_FROM?.includes('hotmail.com');

      return res.status(500).json({
        message: "Failed to send OTP",
        error: "MailerSend API error",
        debug: envCheck,
        hint: isDomainError 
          ? "Gmail/Yahoo/Hotmail domains cannot be verified. Use a custom domain or MailerSend test domain. See FIX_MAILERSEND_DOMAIN.md"
          : process.env.MAIL_FROM && !process.env.MAIL_FROM.includes('@') 
            ? "MAIL_FROM must be an email address (e.g., noreply@yourdomain.com), not a name"
            : "Domain must be verified in MailerSend dashboard. Check server logs for details."
      });
    }

    res.json({ 
      message: "OTP sent successfully",
      email: user.email 
    });

  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({
      message: "Error sending OTP",
      error: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
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
    const config = {
      MAILERSEND_API_KEY: process.env.MAILERSEND_API_KEY ? '✅ Set' : '❌ Missing',
      MAIL_FROM: process.env.MAIL_FROM || '❌ Missing',
      MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || 'Not set (optional)',
    };

    if (!process.env.MAILERSEND_API_KEY) {
      return res.status(400).json({
        message: "MailerSend configuration incomplete",
        config: config,
        error: "MAILERSEND_API_KEY is required",
        hint: "Add MAILERSEND_API_KEY to Render environment variables"
      });
    }

    if (!process.env.MAIL_FROM) {
      return res.status(400).json({
        message: "MailerSend configuration incomplete",
        config: config,
        error: "MAIL_FROM is required",
        hint: "Add MAIL_FROM to Render environment variables (e.g., noreply@yourdomain.com)"
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
        config: config,
        hint: "Check server logs for detailed error message"
      });
    }

    res.json({
      message: "MailerSend configuration valid",
      config: config,
      status: "ready",
    });

  } catch (err) {
    console.error('Test email config error:', err);
    res.status(500).json({
      message: "Email config error",
      error: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
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
