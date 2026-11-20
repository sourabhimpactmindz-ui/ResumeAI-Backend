import { Resend } from "resend";
import nodemailer from "nodemailer";
import "dotenv/config";

const resend = new Resend(process.env.RESEND_API);

export const sendOtp = async (email, otp) => {
  try {
    const data = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Email Verification OTP",
      html: `
        <h2>Email Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP expires in 5 minutes.</p>
      `,
    });

    console.log("Mail Sent:", data);
    return true;
  } catch (error) {
    console.log("Mail Error:", error);
    return false;
  }
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
