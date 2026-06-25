import { User } from "../../model/user.model.js"
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken"
import { sendOtp } from "../../utils/sendMails.js";
import { auth } from "../../config/firebase-admin.js";

export const UserSign = async(req,res) => {
    const {name , email , password} = req.body
    const otp = Math.floor(
        100000 + Math.random() * 900000
    ).toString();

    const otpExpire = Date.now() + 5 * 60 * 1000;
    try{
        if(!name || !email || !password){
            return res.status(400).json({message : "Name,Email and Password is required",status:false})
        }

        const checkexits = await User.findOne({email});

        if(checkexits){
            return res.status(409).json({message : "There's already user with same email!",status:false})
        }



        const hashpassword = await bcrypt.hash(password, 10)

        const NewUser = await User.create({
            name,
            email,
            password : hashpassword,
            isVerified : false,
            otp,
            otpExpire
        });

        
        
        // Send OTP without blocking the response
        sendOtp(email, otp);

        
        return res.status(200).json({message : "user created successfully" , status : true})

    }catch(err){
        return res.status(500).json({message : "Server error", status : false})
    }
}


export const UserLogin = async(req,res) => {
    const {email  , password} = req.body;

    try{
        if(!email || !password){
            return res.status(400).json({message : "Email and Password field are required", status:false})
        }

        const user = await User.findOne({email : email});

        

        if(!user){
return res.status(404).json({
    message: "Account not found. Please sign up first.",
    status: false
});        }

        
        if(!user.isVerified){
            return res.status(400).json({message : "Verify your email first"})
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
        expiresIn: "1m",
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

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(404).json({ message: "User not found", status: false });
    }

    if (user.otp !== otp) {
        return res.status(400).json({ message: "Invalid otp", status: false });
    }

    if (user.otpExpire < Date.now()) {
        return res.status(400).json({ message: "OTP expired", status: false });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpire = null;

    await user.save();

    const accessToken = jwt.sign(
        { id: user._id, email: user.email },
        process.env.SECRET_KEY,
        { expiresIn: "1m" }
    );

    const refreshToken = jwt.sign({
            id:user._id,
            email:user.email
        },process.env.REFRESH_KEY,{
            expiresIn : "7d"
            
        })

    return res.status(200).json({
        message: "Email verified successfully",
        status: true,
        accessToken,  
        refreshToken
    });
};

export const ResendOTP = async(req,res) => {
    const { email } = req.body;

    const user = await User.findOne({ email })

    if(!user){
        return res.status(400).json({message : "user not found" ,status : false})
    }

    const otp = Math.floor(
        100000 + Math.random() * 900000 
    ).toString();

    user.otp = otp;
    user.otpExpire = Date.now() + 5 * 60 * 1000;

    await user.save()
    
    // Send OTP without blocking the response
    sendOtp(email, otp);

  return res.status(200).json({
    message: "OTP Resent Successfully",
    status: true,
  });
}


export const GooogleLogin = async(req,res) => {
    const {token} = req.body

    try{

        const decode = await auth.verifyIdToken(token);
        let user = await User.findOne({email : decode.email})
console.log(token);
        if(!user){
            user = await User.create({
                name : decode.name,
                email : decode.email,
                isVerified : true
            })
        }
console.log("Google Login Hit");
        const accessToken = jwt.sign({
            id: user._id,
            email : user.email,

        },
        process.env.SECRET_KEY,
    {
        expiresIn : "15m"

    },
        )
       const refreshToken =
      jwt.sign(
        {
          id: user._id,
          email: user.email,
        },
        process.env.REFRESH_KEY,
        {
          expiresIn: "7d",
        }
      );

      return res.status(200).json({message : "user login successfull!",status : true , accessToken , refreshToken})


    }catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
}
}