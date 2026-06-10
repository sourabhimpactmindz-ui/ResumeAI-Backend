import nodemailer from "nodemailer";
import "dotenv/config";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

transporter.verify((error, success) => {
  if (error) {
    console.log("SMTP Error:", error);
  } else {
    console.log("SMTP Server Ready");
  }
});

export const sendOtp = async (email, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `"ResumeAI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Email Verification OTP",
      html: `
        <div style="font-family: Arial, sans-serif; padding:20px">
          <h2>Email Verification</h2>

          <p>Your OTP is:</p>

          <div
            style="
              font-size:32px;
              font-weight:bold;
              color:#2563eb;
              letter-spacing:4px;
            "
          >
            ${otp}
          </div>

          <p>This OTP will expire in 5 minutes.</p>

          <p>If you didn't request this OTP, please ignore this email.</p>
        </div>
      `,
    });

    console.log("Mail Sent Successfully:", info.messageId);

    return true;
  } catch (error) {
    console.log("Mail Error:", error);

    return false;
  }
};