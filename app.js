import 'dotenv/config';
import express from 'express';
import router from './router/auth.routes/auth.route.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import resumeRouter from './router/Resume/resume.route.js';

const app = express();

const allowedOrigins = [
  "https://resume-ai-frontend-pi.vercel.app",
  "https://resume-ai-frontend-lqxz.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

app.use(cors({
  origin: (origin, callback) => {
    console.log("Incoming origin:", origin);

    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
      /^https:\/\/resume-ai-frontend(-[a-z0-9-]+)?\.vercel\.app$/.test(origin) ||
      /^https:\/\/resume-ai-frontend-(pi|lqxz)(-[a-z0-9-]+)?\.vercel\.app$/.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(cookieParser());
app.use(express.json());

app.use("/api", router, resumeRouter);

app.get("/health",(req,res) => {
  res.status(200).json({status : "ok" , message : "server is healthy"})
})

export default app;
