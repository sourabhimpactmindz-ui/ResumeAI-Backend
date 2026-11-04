
import express from 'express';
import dotenv from 'dotenv';
import router from './router/auth.routes/auth.route.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import resumeRouter from './router/Resume/resume.route.js';

dotenv.config();

const app = express();

const allowedOrigins = [
  "https://resume-ai-frontend-pi.vercel.app",
  "http://localhost:5173"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(cookieParser());
app.use(express.json());

app.use("/api", router, resumeRouter);

export default app;
