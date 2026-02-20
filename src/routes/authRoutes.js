import express from 'express';
import { sendOtp, verifyOtp, setPassword, createProfile, loginUser, resendOtp, testEmailConfig } from '../controllers/authController.js';
import { checkDatabase } from '../controllers/dbController.js';

const router = express.Router();

router.get('/ping', (req, res) => {
  res.send('Matrimony Auth API working!');
});

router.get('/db-status', checkDatabase);
router.get('/test-email', testEmailConfig);

/* Matrimony Registration Flow */
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/set-password', setPassword);
router.post('/create-profile', createProfile);
router.post('/resend-otp', resendOtp);
router.post('/login', loginUser);

export default router;
