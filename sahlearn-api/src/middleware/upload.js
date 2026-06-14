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
  limits: { fileSize: 10 * 1024 * 1024 },
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
  params: (_req, file) => {
    const nameNoExt = file.originalname
      .replace(/\.[^.]+$/, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '');
    return {
      folder: 'sahlearn/assignments',
      resource_type: 'auto',
      public_id: `${Date.now()}-${nameNoExt}`,
    };
  },
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

// Document upload — for announcements and message attachments
const DOC_MIMES = [
  'image/jpeg', 'image/png', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
];

const docStorage = new CloudinaryStorage({
  cloudinary,
  params: (_req, file) => {
    const isImage = file.mimetype.startsWith('image/');
    // Images: store as image type (renders inline, allows transforms), strip extension.
    // Documents (PDF/Word/Excel/ZIP): store as RAW so Cloudinary delivers them without
    // the PDF/ZIP delivery restriction that returns 401 on image-type resources.
    // Raw resources do NOT auto-append the extension, so keep it in the public_id.
    const base = file.originalname
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    if (isImage) {
      return {
        folder: 'sahlearn/documents',
        resource_type: 'image',
        public_id: `${Date.now()}-${base.replace(/\.[^.]+$/, '')}`,
      };
    }
    return {
      folder: 'sahlearn/documents',
      resource_type: 'raw',
      public_id: `${Date.now()}-${base}`, // keep extension so the URL ends in .pdf/.docx/etc.
    };
  },
});

const docFilter = (_req, file, cb) => {
  if (DOC_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const uploadDoc = multer({
  storage: docStorage,
  fileFilter: docFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = { upload, uploadAssignment, uploadDoc };
