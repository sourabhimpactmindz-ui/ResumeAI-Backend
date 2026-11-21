import { User } from "../../model/user.model.js"
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken"
import { sendOtp } from "../../utils/sendMails.js";
import { auth } from "../../config/firebase-admin.js";

export const UserSign = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        if (!name?.trim() || !email?.trim() || !password) {
            return res.status(400).json({ message: "Name, Email, and Password are required", status: false });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanName = name.trim();

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpire = Date.now() + 5 * 60 * 1000;

        const checkexits = await User.findOne({ email: cleanEmail });

        if (checkexits) {
            if (checkexits.isVerified) {
                return res.status(409).json({ message: "An account with this email already exists! Please log in.", status: false });
            }

            // User previously registered but didn't verify: update credentials and send a new OTP
            checkexits.name = cleanName;
            checkexits.password = await bcrypt.hash(password, 10);
            checkexits.otp = otp;
            checkexits.otpExpire = otpExpire;
            await checkexits.save();

            sendOtp(cleanEmail, otp).catch((err) => console.error("OTP send error:", err));

            return res.status(200).json({
                message: "A new verification code has been sent to your email!",
                status: true,
                email: cleanEmail
            });
        }

        const hashpassword = await bcrypt.hash(password, 10);

        await User.create({
            name: cleanName,
            email: cleanEmail,
            password: hashpassword,
            isVerified: false,
            otp,
            otpExpire
        });

        // Send OTP without blocking the response
        sendOtp(cleanEmail, otp).catch((err) => console.error("OTP send error:", err));

        return res.status(200).json({
            message: "User registered! Verification code sent to your email.",
            status: true,
            email: cleanEmail
        });

    } catch (err) {
        console.error("UserSign error:", err);
        return res.status(500).json({ message: "Server error", status: false });
    }
};


export const UserLogin = async(req,res) => {
    const {email  , password} = req.body;

    try{
        if(!email || !password){
            return res.status(400).json({message : "Email and Password field are required", status:false})
        }

        const cleanEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: cleanEmail });

        if(!user){
            return res.status(404).json({
                message: "Account not found. Please sign up first.",
                status: false
            });
        }

        if(!user.isVerified){
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            user.otp = otp;
            user.otpExpire = Date.now() + 5 * 60 * 1000;
            await user.save();
            sendOtp(cleanEmail, otp).catch((err) => console.error("OTP send error:", err));

            return res.status(400).json({
                message: "Please verify your email first. A new OTP has been sent.",
                unverified: true,
                email: cleanEmail,
                status: false
            });
        }

        const checkPassword = await bcrypt.compare(password , user.password)

        if(!checkPassword){
            return res.status(400).json({message : "Inavlid Credendtials",status:false})

        }

        const accesstoken = jwt.sign({
            id : user._id,
            email:user.email
        },process.env.SECRET_KEY,{expiresIn : "1m"})

        const refreshToken = jwt.sign({
            id:user._id,
            email:user.email
        },process.env.REFRESH_KEY,{
            expiresIn : "7d"
            
        })

        // res.cookie("refreshToken",refreshToken,{
        //     httpOnly : true,
        //     secure:true,
        //     sameSite:"none",
        //     path:"/",
        //     maxAge: 7 * 24 * 60 * 60 * 1000  

        // })

        return res.status(200).json({message : "user login Successfully",status : true , accessToken : accesstoken , refreshToken})

    }catch(error){
        return res.status(500).json({message : "server error",error:error.message,status:false})
    }
}

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      message: "Token not provided!",
      status: false,
    });
  }

  try {
    const decode = jwt.verify(
      refreshToken,
      process.env.REFRESH_KEY
    );

    const newAccessToken = jwt.sign(
      {
        id: decode.id,
        email: decode.email,
      },
      process.env.SECRET_KEY,
      {
        expiresIn: "15m",
      }
    );

    const newRefreshToken = jwt.sign(
      {
        id: decode.id,
        email: decode.email,
      },
      process.env.REFRESH_KEY,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      status: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

  } catch (error) {
    return res.status(403).json({
      message: "Invalid or expired refresh token",
      status: false,
    });
  }
};


export const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    const cleanEmail = email?.trim().toLowerCase();
    const cleanOtp = otp ? String(otp).trim() : "";

    if (!cleanEmail || !cleanOtp) {
        return res.status(400).json({ message: "Email and 6-digit OTP are required", status: false });
    }

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
        return res.status(404).json({ message: "User not found. Please sign up first.", status: false });
    }

    if (String(user.otp).trim() !== cleanOtp) {
        return res.status(400).json({ message: "Invalid OTP. Please check and try again.", status: false });
    }

    if (!user.otpExpire || user.otpExpire < Date.now()) {
        return res.status(400).json({ message: "OTP expired. Please request a new one.", status: false });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpire = null;

    await user.save();

    const accessToken = jwt.sign(
        { id: user._id, email: user.email },
        process.env.SECRET_KEY,
        { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
        { id: user._id, email: user.email },
        process.env.REFRESH_KEY,
        { expiresIn: "7d" }
    );

    return res.status(200).json({
        message: "Email verified successfully!",
        status: true,
        accessToken,  
        refreshToken
    });
};

export const ResendOTP = async (req, res) => {
    const { email } = req.body;
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanEmail) {
        return res.status(400).json({ message: "Email is required to resend OTP", status: false });
    }

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
        return res.status(404).json({ message: "User not found", status: false });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpire = Date.now() + 5 * 60 * 1000;

    await user.save();
    
    // Send OTP without blocking the response
    sendOtp(cleanEmail, otp).catch((err) => console.error("Resend OTP error:", err));

    return res.status(200).json({
        message: "OTP resent successfully! Please check your email.",
        status: true,
    });
};


export const GooogleLogin = async (req, res) => {
    const { token } = req.body;

    try {
        if (!token) {
            return res.status(400).json({
                status: false,
                message: "Google ID token is required."
            });
        }

        if (!auth) {
            console.error("Firebase Admin is not configured. Missing or invalid FIREBASE credentials.");
            return res.status(500).json({
                status: false,
                message: "Firebase Admin is not configured on the server. Please verify FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables."
            });
        }

        if (!process.env.SECRET_KEY || !process.env.REFRESH_KEY) {
            console.error("JWT Secret keys missing. Check SECRET_KEY and REFRESH_KEY environment variables.");
            return res.status(500).json({
                status: false,
                message: "Server configuration error: SECRET_KEY or REFRESH_KEY is missing."
            });
        }

        const decode = await auth.verifyIdToken(token);

        if (!decode?.email) {
            return res.status(400).json({
                status: false,
                message: "Invalid token: Email address not found in Google account."
            });
        }

        let user = await User.findOne({ email: decode.email });

        if (!user) {
            user = await User.create({
                name: decode.name || decode.email.split("@")[0],
                email: decode.email,
                isVerified: true
            });
        } else if (!user.isVerified) {
            user.isVerified = true;
            await user.save();
        }

        const accessToken = jwt.sign(
            {
                id: user._id,
                email: user.email,
            },
            process.env.SECRET_KEY,
            {
                expiresIn: "15m",
            }
        );

        const refreshToken = jwt.sign(
            {
                id: user._id,
                email: user.email,
            },
            process.env.REFRESH_KEY,
            {
                expiresIn: "7d",
            }
        );

        return res.status(200).json({
            message: "User login successful!",
            status: true,
            accessToken,
            refreshToken
        });

    } catch (error) {
        console.error("Google Login Error:", error);
        return res.status(500).json({
            status: false,
            message: error.message || "Failed to authenticate with Google",
        });
    }
};