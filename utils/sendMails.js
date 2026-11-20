import { Resend } from "resend";
import nodemailer from "nodemailer";
import "dotenv/config";

const resend = new Resend(process.env.RESEND_API);

const getTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, 
    },
  });

export const sendOtp = async (email, otp) => {
  const html = `
    <h2>Email Verification</h2>
    <p>Your OTP is:</p>
    <h1>${otp}</h1>
    <p>This OTP expires in 5 minutes.</p>
  `;

  // 1. Gmail SMTP
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const info = await getTransporter().sendMail({
        from: `"ResumeAI" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Email Verification OTP",
        html,
      });
      console.log("OTP sent via Gmail:", info.messageId);
      return true;
    } catch (err) {
      console.warn("Gmail failed, trying Resend:", err.message);
    }
  }

  // 2. Resend fallback
  try {
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Email Verification OTP",
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return false;
    }

    console.log("OTP sent via Resend:", data);
    return true;
  } catch (error) {
    console.error("Resend exception:", error);
    return false;
  }
};