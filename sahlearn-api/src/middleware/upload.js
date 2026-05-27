const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const ALLOWED_FOLDERS = ['courses', 'blog', 'inline'];
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req) => {
    const folder = ALLOWED_FOLDERS.includes(req.query.folder)
      ? req.query.folder
      : 'courses';
    return {
      folder: `sahlearn/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    };
  },
});

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Assignment file upload — accepts documents + images up to 10MB
const ASSIGNMENT_MIMES = [
  'image/jpeg', 'image/png', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'application/x-zip-compressed',
];

const assignmentStorage = new CloudinaryStorage({
  cloudinary,
  params: (_req, file) => ({
    folder: 'sahlearn/assignments',
    resource_type: 'auto',
    public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '')}`,
  }),
});

const assignmentFileFilter = (_req, file, cb) => {
  if (ASSIGNMENT_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Allowed: PDF, Word, ZIP, JPEG, PNG, WebP'), false);
  }
};

const uploadAssignment = multer({
  storage: assignmentStorage,
  fileFilter: assignmentFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = { upload, uploadAssignment };
