import { Resend } from "resend";
import nodemailer from "nodemailer";
import "dotenv/config";

const resend = new Resend(process.env.RESEND_API);

export const sendOtp = async (email, otp) => {
  const mailSubject = "Email Verification OTP - ResumeAI";
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px; color: #111;">
      <h2 style="margin-top: 0; color: #111;">Email Verification</h2>
      <p style="color: #555; font-size: 15px;">Your one-time verification code is:</p>
      <div style="background: #f4f4f5; padding: 16px; border-radius: 6px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #111;">${otp}</span>
      </div>
      <p style="color: #777; font-size: 13px;">This OTP will expire in 5 minutes. If you did not request this, please ignore this email.</p>
    </div>
  `;

  // 1. Try Gmail SMTP via Nodemailer first if configured
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: `"ResumeAI" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: mailSubject,
        html: htmlContent,
      });

      console.log("OTP sent via Gmail SMTP to", email, ":", info.messageId);
      return true;
    } catch (err) {
      console.warn("Gmail SMTP OTP delivery failed, trying Resend:", err.message);
    }
  }

  // 2. Fallback to Resend
  if (process.env.RESEND_API) {
    try {
      const { data, error } = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: mailSubject,
        html: htmlContent,
      });

      if (error) {
        console.error("Resend OTP error:", error);
        return false;
      }

      console.log("OTP sent via Resend to", email, ":", data);
      return true;
    } catch (error) {
      console.error("Resend OTP exception:", error.message);
      return false;
    }
  }

  console.error("No email transport configured (missing EMAIL_USER/EMAIL_PASS and RESEND_API).");
  return false;
};

export const sendContactEmail = async ({ name, email, subject, message }) => {
  const adminEmail = process.env.EMAIL_USER || "sourabrajput723@gmail.com";
  const mailSubject = `[ResumeAI Contact] ${subject || "Inquiry from " + name}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1.5px solid #000; border-radius: 8px; color: #000;">
      <h2 style="margin-top: 0; color: #000;">New ResumeAI Contact Message</h2>
      <p style="color: #555; font-size: 14px;">You have received a new message from the contact form on ResumeAI.</p>
      <hr style="border: none; border-top: 1px solid #e4e4e4; margin: 18px 0;" />
      <p style="margin: 8px 0;"><strong>Sender Name:</strong> ${name}</p>
      <p style="margin: 8px 0;"><strong>Sender Email:</strong> <a href="mailto:${email}" style="color: #000;">${email}</a></p>
      <p style="margin: 8px 0;"><strong>Subject:</strong> ${subject || "N/A"}</p>
      <p style="margin: 16px 0 8px;"><strong>Message:</strong></p>
      <div style="background: #f7f7f7; padding: 14px 18px; border-left: 4px solid #000; border-radius: 4px; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</div>
      <hr style="border: none; border-top: 1px solid #e4e4e4; margin: 18px 0;" />
      <p style="font-size: 12px; color: #888; margin-bottom: 0;">Sent directly from ResumeAI Contact Portal.</p>
    </div>
  `;

  // 1. Try Gmail SMTP via Nodemailer
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: `"ResumeAI Contact" <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        replyTo: email,
        subject: mailSubject,
        html: htmlContent,
      });

      console.log("Contact email sent via Gmail SMTP:", info.messageId);
      return true;
    } catch (err) {
      console.warn("Gmail SMTP delivery failed, trying Resend:", err.message);
    }
  }

  // 2. Fallback to Resend
  try {
    const data = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: adminEmail,
      reply_to: email,
      subject: mailSubject,
      html: htmlContent,
    });

    console.log("Contact email sent via Resend:", data);
    return true;
  } catch (error) {
    console.error("Resend delivery failed:", error.message);
    return false;
  }
};
