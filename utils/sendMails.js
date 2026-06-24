import { Resend } from "resend";
import "dotenv/config";

const resend = new Resend(
  process.env.RESEND_API
);


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