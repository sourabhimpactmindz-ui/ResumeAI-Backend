import multer from 'multer';
import { CloudinaryStorage} from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.config.js';

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'Resume-analyses',
        resource_type: 'raw',
        allowed_formats: ['pdf'],
    }
})

export const Upload = multer({
    storage,

    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf'){
            cb(null,true);
        
        }else{
            cb(new  Error('Only PDF files are allowed'),false);
        }
    }
})