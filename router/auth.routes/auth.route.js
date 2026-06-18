import express from 'express';
import { refreshToken, ResendOTP, UserLogin, UserSign, verifyOtp } from '../../controller/user/auth.controller.js';



const router = express.Router();


router.post("/signup",UserSign);
router.post("/login",UserLogin)
router.post("/refresh",refreshToken)
router.post("/verify-otp",verifyOtp)
router.post("/resend-otp",ResendOTP)

export default router