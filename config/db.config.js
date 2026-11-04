import mongoose from "mongoose";
import dns from 'dns'

dns.setServers(['1.1.1.1'])

export const dbconnect = async() =>{
   try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Database Connected");
} catch (err) {
  console.error("❌ Database Error:", err);
}
}
