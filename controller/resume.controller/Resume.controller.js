// import Resume from "../../model/Resume.model.js";
import Resume from "../../model/resume.model.js"
import pdf from "pdf-parse-fork";
import axios from 'axios';
import { analyzeResume } from "../../config/ATS.config.js";

export const UploadResume = async (req, res) => {

    const { jobDescription } = req.body;
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "No file uploaded",
                status: false
            });
        }

        if (!jobDescription) {
            return res.status(400).json({
                message: "Job description is required",
                status: false
            });
        }

        const pdfResponse = await axios.get(req.file.path, {
            responseType: "arraybuffer"
        });

        const pdfData = await pdf(pdfResponse.data);
        const extractedText = pdfData.text;

        if (!extractedText || extractedText.trim().length === 0) {
            return res.status(400).json({
                message: "Could not extract text from PDF",
                status: false
            });
        }


const analysis = await analyzeResume(
  extractedText,
  jobDescription
);

        const existingResume = await Resume.findOne({
    userId: req.userid
});

  if (existingResume) {

    const updatedResume = await Resume.findByIdAndUpdate(
        existingResume._id,
        {
            filename: req.file.originalname,
            fileUrl: req.file.path,
            extractedText,
            jobDescription,
            atsScore: analysis.atsScore,
            strength: analysis.strength,
            matchingSkills: analysis.matchingSkills,
            missingSkills: analysis.missingSkills,
            suggestions: analysis.suggestions,
        },
        {
            returnDocument: "after"
        }
    );

    return res.status(200).json({
        message: "Resume updated successfully",
        data: updatedResume,
        status: true
    });
}

        const createResume = await Resume.create({
            userId: req.userid,
            filename: req.file.originalname,
            fileUrl: req.file.path,
            extractedText: extractedText.substring(0, 5000), 
            jobDescription,
            atsScore: Math.min(100, Math.max(0, Number(analysis.atsScore) || 0)),
            strength: Array.isArray(analysis.strength) ? analysis.strength : [],
            matchingSkills: Array.isArray(analysis.matchingSkills) ? analysis.matchingSkills : [],
            missingSkills: Array.isArray(analysis.missingSkills) ? analysis.missingSkills : [],
            suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : [],
        });


        return res.status(200).json({
            message: "Resume uploaded and analyzed successfully",
            data: createResume,
            status: true
        });

    } 

       catch (error) {

  return res.status(500).json({
    message: "Server error",
    error: error.message,
    status: false
  });

    }
};