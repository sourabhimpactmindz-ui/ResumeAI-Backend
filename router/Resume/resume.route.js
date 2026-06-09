
import express from "express";
import { UploadResume } from "../../controller/resume.controller/Resume.controller.js";
import { Upload } from "../../config/multer.config.js";
import { userAuth } from "../../middleware/auth.middle.js";

const router = express.Router();

router.post("/upload",userAuth, Upload.single("resume"), UploadResume)

export default router;