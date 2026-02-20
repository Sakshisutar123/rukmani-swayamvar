import User from '../models/User.js';
import fs from 'fs';
import { parseProfilePictureToPhotos, formatProfilePictureFromPhotos } from '../utils/photoUrl.js';
import path from 'path';
import bcrypt from 'bcrypt';
import otpGenerator from 'otp-generator';
import dotenv from 'dotenv';
dotenv.config();

/* ----------------------- BREVO (API EMAIL + SMS) ----------------------- */
import brevo from "@getbrevo/brevo";

/** Normalize phone: ensure + and country code. E.g. 9876543210 → +919876543210 if default country is India. */
function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  if (phone.trim().startsWith('+')) return phone.trim();
  const defaultCountryCode = process.env.SMS_DEFAULT_COUNTRY_CODE || '91';
  return `+${defaultCountryCode}${digits.slice(-10)}`;
}

/** Check if request is email-based (has valid email, no phone) or phone-based (has valid phone, no email). */
function getSendOtpTarget(body) {
  const { email, phone } = body || {};
  const hasEmail = email && typeof email === 'string' && email.includes('@');
  const normalizedPhone = normalizePhone(phone);
  const hasPhone = !!normalizedPhone;
  if (hasEmail && !hasPhone) return { channel: 'email', email: email.trim(), phone: null };
  if (hasPhone && !hasEmail) return { channel: 'phone', email: null, phone: normalizedPhone };
  return null;
}

async function sendEmail(to, subject, html) {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.error("❌ BREVO_API_KEY not set");
      return false;
    }
    if (!process.env.MAIL_FROM) {
      console.error("❌ MAIL_FROM not set");
      return false;
    }
    if (!to || !to.includes('@')) {
      console.error("❌ Invalid recipient email:", to);
      return false;
    }

    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = {
      name: process.env.MAIL_FROM_NAME || "Matrimony App",
      email: process.env.MAIL_FROM
    };
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;

    console.log(`📧 Sender: ${JSON.stringify(sendSmtpEmail.sender)}`);
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("📧 Email sent to:", to);
    return true;
  } catch (err) {
    console.error("❌ Brevo error:", err.message || err);
    let errorData = {
      message: err.message,
      status: err.status || err.response?.status,
      responseBody: err.response?.body || err.response?.data,
      errorCode: err.code
    };
    console.error("❌ Detailed error:", JSON.stringify(errorData, null, 2));
    return false;
  }
}

/**
 * Send SMS via Brevo Transactional SMS.
 * Returns { ok: true } or { ok: false, reason: string }.
 * Brevo requires: SMS enabled on account, sender configured in Brevo SMS settings, and credits.
 */
async function sendSms(recipient, content) {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.error("❌ BREVO_API_KEY not set");
      return { ok: false, reason: "BREVO_API_KEY not set" };
    }
    const sender = (process.env.SMS_SENDER || 'Matrimony').trim().slice(0, 11);
    if (!sender) {
      console.error("❌ SMS_SENDER is required by Brevo for SMS");
      return { ok: false, reason: "SMS_SENDER must be set in .env (e.g. SMS_SENDER=Matrimony)" };
    }
    if (!recipient || recipient.length < 10) {
      console.error("❌ Invalid SMS recipient:", recipient);
      return { ok: false, reason: "Invalid recipient" };
    }

    const apiInstance = new brevo.TransactionalSMSApi();
    apiInstance.setApiKey(
      brevo.TransactionalSMSApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    const sendTransacSms = new brevo.SendTransacSms();
    sendTransacSms.sender = sender;
    sendTransacSms.recipient = recipient.startsWith('+') ? recipient : `+${recipient}`;
    sendTransacSms.content = content;
    sendTransacSms.type = 'transactional';

    await apiInstance.sendTransacSms(sendTransacSms);
    console.log("📱 SMS sent to:", recipient);
    return { ok: true };
  } catch (err) {
    const status = err.response?.status ?? err.status ?? err.statusCode;
    const body = err.response?.body ?? err.body ?? err.response?.data;
    const msg = err.message || String(err);
    console.error("❌ Brevo SMS error:", msg);
    console.error("❌ Brevo SMS status:", status, "body:", JSON.stringify(body, null, 2));

    let reason = "SMS service error";
    if (status === 402) reason = "Insufficient SMS credits in Brevo account";
    else if (status === 400) reason = "Bad request (check sender name and recipient format in Brevo)";
    else if (status === 404) reason = "SMS not enabled or sender not configured in Brevo";
    else if (body?.message) reason = body.message;

    return { ok: false, reason };
  }
}

/* ======================== MATRIMONY REGISTRATION FLOW ======================== */

/* 1️⃣ SEND OTP - USER CHOOSES EMAIL OR PHONE TO RECEIVE OTP */
export const sendOtp = async (req, res) => {
  try {
    const target = getSendOtpTarget(req.body);

    if (!target) {
      return res.status(400).json({
        message: 'Provide either email or phone to receive OTP',
        hint: 'Send { "email": "you@example.com" } OR { "phone": "+919876543210" }'
      });
    }

    const { channel, email, phone } = target;

    // Find existing user by email or phone
    const where = channel === 'email'
      ? { email }
      : { phone };
    const existingUser = await User.findOne({ where });

    if (existingUser && existingUser.isRegistered) {
      return res.status(400).json({
        message: channel === 'email' ? 'Email already registered' : 'Phone already registered',
        hint: 'Please login or use a different ' + channel
      });
    }

    if (existingUser && !existingUser.isRegistered) {
      await existingUser.destroy();
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
    });
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    const createPayload = {
      otp,
      otpExpiry,
      isVerified: false,
      isRegistered: false
    };
    if (channel === 'email') {
      createPayload.email = email;
      createPayload.phone = null;
    } else {
      createPayload.phone = phone;
      createPayload.email = `__phone__${phone.replace(/\D/g, '')}@otp.placeholder`;
    }

    const user = await User.create(createPayload);

    console.log(`📤 OTP for ${channel} ${channel === 'email' ? email : phone}: ${otp} (expires in 5 minutes)`);

    if (channel === 'email') {
      const emailSent = await sendEmail(
        email,
        "Matrimony Registration - OTP Verification",
        `<h2>Welcome to Matrimony App!</h2>
         <p>Your OTP for registration is: <b>${otp}</b></p>
         <p>This OTP expires in 5 minutes.</p>
         <p>Do not share this OTP with anyone.</p>`
      );
      if (!emailSent) {
        const envCheck = {
          BREVO_API_KEY: process.env.BREVO_API_KEY ? '✅ Set' : '❌ Missing',
          MAIL_FROM: process.env.MAIL_FROM || '❌ Missing',
          userEmail: email || '❌ Missing'
        };
        return res.status(500).json({
          message: "Failed to send OTP",
          error: "Email service error",
          debug: envCheck,
          hint: "Check server logs for detailed error message",
          temp_otp_for_testing: otp
        });
      }
      return res.status(200).json({
        message: "OTP sent to your email",
        channel: "email",
        email,
        hint: "Check your email for the OTP. Valid for 5 minutes."
      });
    }

    const smsContent = `Your Matrimony OTP is ${otp}. Valid for 5 minutes. Do not share.`;
    const smsResult = await sendSms(phone, smsContent);
    if (!smsResult.ok) {
      return res.status(500).json({
        message: "Failed to send OTP",
        error: smsResult.reason,
        debug: {
          BREVO_API_KEY: process.env.BREVO_API_KEY ? '✅ Set' : '❌ Missing',
          SMS_SENDER: process.env.SMS_SENDER ? '✅ Set' : '❌ Not set (required for SMS)'
        },
        hint: "Add SMS_SENDER to .env (e.g. SMS_SENDER=Matrimony). In Brevo: enable SMS, add sender, check credits.",
        temp_otp_for_testing: otp
      });
    }
    return res.status(200).json({
      message: "OTP sent to your phone",
      channel: "phone",
      phone,
      hint: "Check your SMS for the OTP. Valid for 5 minutes."
    });

  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
};

/* 2️⃣ VERIFY OTP - VERIFY OTP (IDENTIFY USER BY EMAIL OR PHONE) */
export const verifyOtp = async (req, res) => {
  try {
    const { email, phone, otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        message: 'OTP is required'
      });
    }

    const hasEmail = email && typeof email === 'string' && email.includes('@');
    const normalizedPhone = normalizePhone(phone);
    const hasPhone = !!normalizedPhone;

    if (!hasEmail && !hasPhone) {
      return res.status(400).json({
        message: 'Provide either email or phone (same as used in send-otp)',
        hint: 'Send { "email": "...", "otp": "..." } OR { "phone": "...", "otp": "..." }'
      });
    }
    if (hasEmail && hasPhone) {
      return res.status(400).json({
        message: 'Provide only one of email or phone'
      });
    }

    const where = hasEmail ? { email: email.trim() } : { phone: normalizedPhone };
    const user = await User.findOne({ where });

    if (!user) {
      return res.status(404).json({
        message: 'User not found. Please send OTP first'
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        message: 'Invalid OTP'
      });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({
        message: 'OTP expired. Please request a new OTP'
      });
    }

    await user.update({
      otp: null,
      otpExpiry: null,
      isVerified: true
    });

    const identifier = hasEmail ? email : normalizedPhone;
    console.log(`✅ User OTP verified: ${identifier}`);

    const response = {
      message: 'OTP verified successfully',
      userId: user.id,
      hint: 'Please set your password'
    };
    if (user.email && !user.email.includes('@otp.placeholder')) response.email = user.email;
    if (user.phone) response.phone = user.phone;
    res.json(response);

  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
};

/* 3️⃣ SET PASSWORD - COMPLETE REGISTRATION (IDENTIFY BY EMAIL OR PHONE) */
export const setPassword = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if (!password) {
      return res.status(400).json({
        message: 'Password is required'
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long'
      });
    }

    const hasEmail = email && typeof email === 'string' && email.includes('@');
    const normalizedPhone = normalizePhone(phone);
    const hasPhone = !!normalizedPhone;
    if (!hasEmail && !hasPhone) {
      return res.status(400).json({
        message: 'Provide either email or phone (same as used in verify-otp)'
      });
    }
    if (hasEmail && hasPhone) {
      return res.status(400).json({ message: 'Provide only one of email or phone' });
    }

    const where = hasEmail ? { email: email.trim() } : { phone: normalizedPhone };
    const user = await User.findOne({ where });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please verify OTP first' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    await user.update({ passwordHash, isRegistered: true });

    console.log(`✅ User password set: ${hasEmail ? email : normalizedPhone}`);
    const out = { message: 'Password set successfully. You can now create your profile or login.', userId: user.id };
    if (user.email && !user.email.includes('@otp.placeholder')) out.email = user.email;
    if (user.phone) out.phone = user.phone;
    res.json(out);

  } catch (err) {
    console.error('Set password error:', err);
    res.status(500).json({ message: 'Error setting password', error: err.message });
  }
};

/* 4️⃣ CREATE/UPDATE PROFILE - USER ENTERS PERSONAL DATA AFTER REGISTRATION */
export const createProfile = async (req, res) => {
  try {
    console.log('CreateProfile body:', req.body);
    const {
      userId,
      phone,
      fullName,
      gender,
      dateOfBirth,
      age,
      height,
      weight,
      skinTone,
      doSmoke,
      doDrink,
      diet,
      religion,
      caste,
      subCaste,
      city,
      state,
      country,
      address,
      profession,
      occupation,
      education,
      workExperience,
      income,
      companyName,
      workLocation,
      maritalStatus,
      haveChildren,
      motherTongue,
      manglikStatus,
      aboutMe,
      familyStatus,
      familyValues,
      familyType,
      familyIncome,
      motherOccupation,
      fatherOccupation,
      whoUses,
      bio,
      profilePicture,
      photoUrls
    } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        message: 'userId is required' 
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    if (!user.isRegistered) {
      return res.status(400).json({ 
        message: 'Please complete password setup first' 
      });
    }

    // Update user profile with all provided data
    console.log('User before update:', user.toJSON());
    const updateData = {
      phone: phone ?? user.phone,
      fullName: fullName ?? user.fullName,
      whoUses: whoUses ?? user.whoUses,
      gender: gender ?? user.gender,
      dateOfBirth: dateOfBirth ?? user.dateOfBirth,
      age: age ?? user.age,
      height: height ?? user.height,
      weight: weight ?? user.weight,
      skinTone: skinTone ?? user.skinTone,
      doSmoke: doSmoke ?? user.doSmoke,
      doDrink: doDrink ?? user.doDrink,
      diet: diet ?? user.diet,
      religion: religion ?? user.religion,
      caste: caste ?? user.caste,
      subCaste: subCaste ?? user.subCaste,
      city: city ?? user.city,
      state: state ?? user.state,
      country: country ?? user.country ?? 'India',
      address: address ?? user.address,
      profession: profession ?? user.profession,
      occupation: occupation ?? user.occupation,
      education: education ?? user.education,
      workExperience: workExperience ?? user.workExperience,
      income: income ?? user.income,
      companyName: companyName ?? user.companyName,
      workLocation: workLocation ?? user.workLocation,
      maritalStatus: maritalStatus ?? user.maritalStatus,
      haveChildren: haveChildren ?? user.haveChildren,
      motherTongue: motherTongue ?? user.motherTongue,
      manglikStatus: manglikStatus ?? user.manglikStatus,
      aboutMe: aboutMe ?? user.aboutMe,
      familyStatus: familyStatus ?? user.familyStatus,
      familyValues: familyValues ?? user.familyValues,
      familyType: familyType ?? user.familyType,
      familyIncome: familyIncome ?? user.familyIncome,
      motherOccupation: motherOccupation ?? user.motherOccupation,
      fatherOccupation: fatherOccupation ?? user.fatherOccupation,
      bio: bio ?? user.bio,
      profilePicture: profilePicture ?? user.profilePicture
    };
    console.log('Update payload:', updateData);
    try {
      const logDir = path.resolve(process.cwd(), 'logs');
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      fs.writeFileSync(path.join(logDir, 'last_update.json'), JSON.stringify({ userId: userId, updateData }, null, 2));
    } catch (e) {
      console.error('Failed to write update log:', e.message || e);
    }
    await user.update(updateData);

    // Add profile photos if provided (store as comma-separated in users.profilePicture)
    const urls = Array.isArray(photoUrls) ? photoUrls.filter((u) => typeof u === 'string' && u.trim()) : [];
    if (urls.length > 0) {
      const maxPhotos = 10;
      const existing = parseProfilePictureToPhotos(user.profilePicture);
      const toAdd = urls.slice(0, Math.max(0, maxPhotos - existing.length)).map((u) => u.trim());
      if (toAdd.length > 0) {
        const allNames = existing.map((p) => p.url).concat(toAdd);
        await user.update({ profilePicture: formatProfilePictureFromPhotos(allNames) });
      }
    }

    // reload to get latest DB values
    await user.reload();
    console.log(`✅ User profile created/updated: ${user.id}`);

    res.json({ 
      message: 'Profile created successfully',
      userId: user.id,
      user: user.toJSON()
    });

  } catch (err) {
    console.error('Create profile error:', err);
    const details = err.errors ? err.errors.map(e => ({ message: e.message, path: e.path, value: e.value })) : null;
    res.status(500).json({ 
      message: 'Error creating profile', 
      error: err.message,
      details
    });
  }
};
export const loginUser = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if (!password) {
      return res.status(400).json({
        message: 'Password is required'
      });
    }

    const hasEmail = email && typeof email === 'string' && email.includes('@');
    const normalizedPhone = normalizePhone(phone);
    const hasPhone = !!normalizedPhone;
    if (!hasEmail && !hasPhone) {
      return res.status(400).json({
        message: 'Provide either email or phone with password'
      });
    }
    if (hasEmail && hasPhone) {
      return res.status(400).json({ message: 'Provide only one of email or phone' });
    }

    const where = hasEmail ? { email: email.trim() } : { phone: normalizedPhone };
    const user = await User.findOne({ where });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!user.isRegistered) {
      return res.status(400).json({ message: 'Please complete registration first' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const jwt = await import("jsonwebtoken");
    const token = jwt.default.sign(
      { id: user.id, email: user.email, phone: user.phone },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: "7d" }
    );

    const userPayload = {
      id: user.id,
      fullName: user.fullName,
      gender: user.gender,
      age: user.age,
      city: user.city,
      country: user.country
    };
    if (user.email && !user.email.includes('@otp.placeholder')) userPayload.email = user.email;
    if (user.phone) userPayload.phone = user.phone;

    res.json({
      message: "Login successful",
      token,
      user: userPayload
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
};

/* 5️⃣ RESEND OTP - SAME CHANNEL AS SEND-OTP (EMAIL OR PHONE) */
export const resendOtp = async (req, res) => {
  try {
    const target = getSendOtpTarget(req.body);

    if (!target) {
      return res.status(400).json({
        message: 'Provide either email or phone (same as used in send-otp)',
        hint: 'Send { "email": "..." } OR { "phone": "..." }'
      });
    }

    const { channel, email, phone } = target;
    const where = channel === 'email' ? { email } : { phone };
    const user = await User.findOne({ where });

    if (!user) {
      return res.status(404).json({
        message: 'User not found. Please send OTP first'
      });
    }
    if (user.isRegistered) {
      return res.status(400).json({
        message: 'User already registered. Please login'
      });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
    });
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.update({ otp, otpExpiry });

    console.log(`📤 Resent OTP for ${channel} ${channel === 'email' ? email : phone}: ${otp}`);

    if (channel === 'email') {
      const emailSent = await sendEmail(
        email,
        "Matrimony Registration - OTP Verification",
        `<h2>OTP Resent</h2>
         <p>Your new OTP is: <b>${otp}</b></p>
         <p>This OTP expires in 5 minutes.</p>`
      );
      if (!emailSent) {
        return res.status(500).json({
          message: "Failed to send OTP",
          error: "Email service error",
          temp_otp_for_testing: otp
        });
      }
      return res.json({
        message: "OTP resent to your email",
        channel: "email",
        email
      });
    }

    const smsContent = `Your Matrimony OTP is ${otp}. Valid for 5 minutes. Do not share.`;
    const smsResult = await sendSms(phone, smsContent);
    if (!smsResult.ok) {
      return res.status(500).json({
        message: "Failed to send OTP",
        error: smsResult.reason,
        hint: "Check SMS_SENDER in .env and Brevo SMS settings / credits.",
        temp_otp_for_testing: otp
      });
    }
    return res.json({
      message: "OTP resent to your phone",
      channel: "phone",
      phone
    });

  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
};

/* 6️⃣ TEST EMAIL CONFIG */
export const testEmailConfig = async (req, res) => {
  try {
    const config = {
      BREVO_API_KEY: process.env.BREVO_API_KEY ? '✅ Set' : '❌ Missing',
      MAIL_FROM: process.env.MAIL_FROM || '❌ Missing',
      MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || 'Not set (optional)',
    };

    if (!process.env.BREVO_API_KEY || !process.env.MAIL_FROM) {
      return res.status(400).json({
        message: "Email configuration incomplete",
        config: config,
        error: "BREVO_API_KEY and MAIL_FROM are required",
        hint: "Add these to your .env file"
      });
    }

    const test = await sendEmail(
      process.env.MAIL_FROM,
      "Matrimony App - Email Config Test",
      "<h2>Email Configuration Working!</h2><p>Your email service is configured correctly.</p>"
    );

    if (!test) {
      return res.status(500).json({
        message: "Email test failed",
        config: config
      });
    }

    res.json({
      message: "Email configuration is valid",
      config: config,
      status: "ready"
    });

  } catch (err) {
    console.error('Test email config error:', err);
    res.status(500).json({
      message: "Email config error",
      error: err.message
    });
  }
};
