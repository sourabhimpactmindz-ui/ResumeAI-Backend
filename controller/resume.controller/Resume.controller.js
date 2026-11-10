
import Resume from "../../model/resume.model.js";
import axios from "axios";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { analyzeResume } from "../../config/ATS.config.js";

export const UploadResume = async (req, res) => {
  let stage = "START";

  try {
    stage = "VALIDATION";

    const { jobDescription } = req.body;

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
        status: false,
      });
    }

    if (!jobDescription?.trim()) {
      return res.status(400).json({
        message: "Job description is required",
        status: false,
      });
    }

    stage = "PDF_DOWNLOAD";

    const pdfResponse = await axios.get(req.file.path, {
      responseType: "arraybuffer",
      timeout: 30000,
    });

    const pdfBuffer = Buffer.from(pdfResponse.data);

    stage = "PDF_PARSING";

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
    });

    const pdfDocument = await loadingTask.promise;

    let extractedText = "";

    for (
      let pageNum = 1;
      pageNum <= pdfDocument.numPages;
      pageNum++
    ) {
      const page = await pdfDocument.getPage(pageNum);

      const content = await page.getTextContent();

      extractedText += content.items
        .map((item) => item.str || "")
        .join(" ") + "\n";
    }

    extractedText = extractedText.trim();

    if (!extractedText) {
      return res.status(400).json({
        message: "Could not extract text from PDF",
        status: false,
      });
    }

    stage = "AI_ANALYSIS";

    const analysis = await analyzeResume(
      extractedText,
      jobDescription.trim()
    );

    if (!analysis || typeof analysis !== "object") {
      throw new Error("Invalid AI analysis response");
    }

    const resumeData = {
      filename: req.file.originalname,
      fileUrl: req.file.path,
      extractedText: extractedText.substring(0, 5000),
      jobDescription: jobDescription.trim(),
      atsScore: Math.min(
        100,
        Math.max(0, Number(analysis.atsScore) || 0)
      ),
      strength: Array.isArray(analysis.strength)
        ? analysis.strength : [],
      matchingSkills: Array.isArray(analysis.matchingSkills)
        ? analysis.matchingSkills : [],
      missingSkills: Array.isArray(analysis.missingSkills)
        ? analysis.missingSkills : [],
      suggestions: Array.isArray(analysis.suggestions)
        ? analysis.suggestions : [],
    };

    stage = "DATABASE_CHECK";

    const existingResume = await Resume.findOne({
      userId: req.userid,
    });

    stage = "DATABASE_SAVE";

    if (existingResume) {
      const updatedResume = await Resume.findByIdAndUpdate(
        existingResume._id,
        resumeData,
        {
          new: true,
          runValidators: true,
        }
      );

      return res.status(200).json({
        message: "Resume updated successfully",
        data: updatedResume,
        status: true,
      });
    }

    const createResume = await Resume.create({
      userId: req.userid,
      ...resumeData,
    });

    return res.status(201).json({
      message: "Resume uploaded and analyzed successfully",
      data: createResume,
      status: true,
    });

  } catch (error) {
    console.error("UPLOAD RESUME ERROR");
    console.error("Failed Stage:", stage);
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);

    return res.status(500).json({
      message: "Resume upload failed",
      failedStage: stage,
      status: false,
    });
  }
};
