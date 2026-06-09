import mongoose from "mongoose";

export const dbconnect = async() =>{
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("database connected successfully")

    }catch{
        console.log("database error")
    }
}
