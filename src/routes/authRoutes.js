import express from 'express';
import { checkUser, sendOtp, verifyOtp, setPassword, loginUser, testEmailConfig } from '../controllers/authController.js';

const router = express.Router();

router.post('/check-user', checkUser);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/set-password', setPassword);
router.post('/login', loginUser);
router.get('/test-email', testEmailConfig); // Test email configuration

export default router;
