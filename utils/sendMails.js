import nodemailer from "nodemailer"
import 'dotenv/config'

const transporter = nodemailer.createTransport({
        service : "gmail",

        auth : {
            user : process.env.EMAIL_USER,
            pass : process.env.EMAIL_PASS
        },


    });

export const sendOtp = async(email , otp) => {
    try{

         await transporter.sendMail({
        from : process.env.EMAIL_USER,
        to:email,
subject: "Email Verification OTP",
    html: `
      <div style="font-family:sans-serif">
        <h2>Email Verification</h2>
        <p>Your OTP is:</p>

        <h1 style="color:blue">${otp}</h1>

        <p>This OTP will expire in 5 minutes.</p>
      </div>
    `,

})

    }catch (error) {
        console.log("Mail Error:", error);
    }
   
}

