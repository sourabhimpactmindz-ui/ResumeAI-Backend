import "dotenv/config";
import mongoose from "mongoose";
import axios from "axios";
import { Worker, UnrecoverableError } from "bullmq";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { connection } from "../../config/redis.config.js";
import Resume from "../../model/resume.model.js";
import { analyzeResume } from "../../config/ATS.config.js";

if (mongoose.connection.readyState === 0) {
  await mongoose.connect(process.env.MONGO_URI);
}

async function extractText(fileUrl) {
  const { data } = await axios.get(fileUrl, {
    responseType: "arraybuffer",
    timeout: 30000,
  });

  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(Buffer.from(data)),
    useSystemFonts: true,
  }).promise;

  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str || "").join(" ") + "\n";
  }
  return text.trim();
}

const worker = new Worker(
  "resume-analysis",
  async (job) => {
    const resume = await Resume.findById(job.data.resumeId);
    if (!resume) throw new UnrecoverableError("Resume not found");

    await Resume.updateOne({ _id: resume._id }, { status: "processing" });

    const extractedText = await extractText(resume.fileUrl);
    if (!extractedText) {
      throw new UnrecoverableError("Could not extract text from PDF");
    }

    const analysis = await analyzeResume(extractedText, resume.jobDescription);
    if (!analysis || typeof analysis !== "object") {
      throw new Error("Invalid AI analysis response"); 
    }

    await Resume.updateOne(
      { _id: resume._id },
      {
        status: "completed",
        errorMessage: null,
        extractedText: extractedText.substring(0, 5000),
        atsScore: Math.min(100, Math.max(0, Number(analysis.atsScore) || 0)),
        strength: Array.isArray(analysis.strength) ? analysis.strength : [],
        matchingSkills: Array.isArray(analysis.matchingSkills) ? analysis.matchingSkills : [],
        missingSkills: Array.isArray(analysis.missingSkills) ? analysis.missingSkills : [],
        suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : [],
      }
    );
  },
  {
    connection,
    concurrency: 3,                                
    limiter: { max: 10, duration: 60_000 },        
  }
);

worker.on("failed", async (job, err) => {
  if (!job) return;
  const exhausted =
    err instanceof UnrecoverableError || job.attemptsMade >= (job.opts.attempts ?? 1);
  if (exhausted) {
    await Resume.updateOne(
      { _id: job.data.resumeId },
      { status: "failed", errorMessage: err.message }
    );
  }
  console.error(`Job ${job.id} failed (attempt ${job.attemptsMade}):`, err.message);
});

worker.on("error", (err) => console.error("Worker error:", err));

worker.on("ready", () => console.log("Worker ready, waiting for jobs"));
worker.on("active", (job) => console.log(`Job ${job.id} started`));
worker.on("completed", (job) => console.log(`Job ${job.id} completed`));

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});