import Resume from "../../model/resume.model.js";
import { resumeQueue } from "../../utils/queues/resume.queue.js";

export const UploadResume = async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded", status: false });
    }
    if (!jobDescription?.trim()) {
      return res.status(400).json({ message: "Job description is required", status: false });
    }

    const resume = await Resume.findOneAndUpdate(
      { userId: req.userid },
      {
        filename: req.file.originalname,
        fileUrl: req.file.path,
        jobDescription: jobDescription.trim(),
        status: "pending",
        errorMessage: null,
        atsScore: 0,
        strength: [],
        matchingSkills: [],
        missingSkills: [],
        suggestions: [],
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    await resumeQueue.add("analyze-resume", {
      resumeId: resume._id.toString(),
    });

    return res.status(202).json({
      message: "Resume received. Analysis in progress.",
      data: { resumeId: resume._id, status: resume.status },
      status: true,
    });
  } catch (error) {
    console.error("UPLOAD RESUME ERROR:", error);
    return res.status(500).json({ message: "Resume upload failed", status: false });
  }
};

export const  GetResumeStatus = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.userid });
    if (!resume) {
      return res.status(404).json({ message: "Resume not found", status: false });
    }

    return res.status(200).json({
      status: true,
      data:
        resume.status === "completed"
          ? resume
          : { status: resume.status, errorMessage: resume.errorMessage },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch status", status: false });
  }
};