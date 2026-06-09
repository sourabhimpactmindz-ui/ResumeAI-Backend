import express from 'express';
import dotenv from 'dotenv';
import router from './router/auth.routes/auth.route.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import resumeRouter from './router/Resume/resume.route.js';
dotenv.config();

const app = express();
app.use(cors({
    origin: "http://localhost:5173",
    credentials : true
}));
app.use(cookieParser());

app.use(express.json())


app.use("/api" , router , resumeRouter)

export default app;