import express from 'express';
import { GooogleLogin, refreshToken, ResendOTP, UserLogin, UserSign, verifyOtp } from '../../controller/user/auth.controller.js';
import { handleContactMessage } from '../../controller/contact.controller.js';

const router = express.Router();

router.post("/signup", UserSign);
router.post("/login", UserLogin);
router.post("/refresh", refreshToken);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", ResendOTP);
router.post("/google-login", GooogleLogin);
router.post("/contact", handleContactMessage);

export default router;
