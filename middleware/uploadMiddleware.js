import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage engine
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for PDF and PPTX/PPT files
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const isAllowedExtension = ['.pdf', '.ppt', '.pptx'].includes(fileExtension);
    const isAllowedMime = allowedMimeTypes.includes(file.mimetype);

    if (isAllowedMime || isAllowedExtension) {
        cb(null, true);
    } else {
        cb(new Error('Only course documents in PDF or PPT/PPTX format are allowed.'), false);
    }
};

// Multer upload config
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 15 * 1024 * 1024 // 15MB limit
    }
});
