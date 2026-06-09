import mongoose, { mongo } from "mongoose";

const UserSchema = new mongoose.Schema({
    name : {
        type : String,
        trim : true
    },

    email : {
        type : String,
        unique : true,
        require : true
    },

    password : {
        type : String
    },
    isVerified: {
        type: Boolean,
        default : false
    },
    otp : String,
    otpExpire : Date
})

export const User = mongoose.model("User" , UserSchema);

