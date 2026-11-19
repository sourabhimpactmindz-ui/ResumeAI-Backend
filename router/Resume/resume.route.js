
import express from "express";
import { GetResumeStatus, UploadResume } from "../../controller/resume.controller/Resume.controller.js";
import { Upload } from "../../config/multer.config.js";
import { userAuth } from "../../middleware/auth.middle.js";

const router = express.Router();

router.post("/upload",userAuth, Upload.single("resume"), UploadResume)
router.get("/resume/status/:id", userAuth, GetResumeStatus);
export default router;