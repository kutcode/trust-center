import multer from 'multer';
import { Request } from 'express';
import { AppError } from './errorHandler';

// Configure multer for file uploads
const storage = multer.memoryStorage();

const MAX_UPLOAD_MB = Number(process.env.DOCUMENT_UPLOAD_MAX_MB || '25');
const MAX_UPLOAD_BYTES = Math.max(1, Math.floor((Number.isFinite(MAX_UPLOAD_MB) ? MAX_UPLOAD_MB : 25) * 1024 * 1024));

const ALLOWED_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'image/png',
  'image/jpeg',
  'image/jpg',
];

function getFileExtension(fileName: string): string {
  const normalized = String(fileName || '').trim().toLowerCase();
  const idx = normalized.lastIndexOf('.');
  if (idx < 0) return '';
  return normalized.slice(idx + 1);
}

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = getFileExtension(file.originalname);
  const isAllowedExt = ['pdf', 'docx', 'png', 'jpg', 'jpeg'].includes(ext);

  if (ALLOWED_MIMES.includes(file.mimetype) && isAllowedExt) {
    cb(null, true);
  } else {
    cb(new AppError(`Invalid file type: ${file.mimetype}. Allowed types: PDF, DOCX, PNG, JPG`, 400));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
  },
});

function isPdfBuffer(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46; // %PDF
}

function isPngBuffer(buffer: Buffer): boolean {
  if (buffer.length < 8) return false;
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return sig.every((byte, index) => buffer[index] === byte);
}

function isJpegBuffer(buffer: Buffer): boolean {
  if (buffer.length < 3) return false;
  return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

function isZipLikeBuffer(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  return buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04; // PK..
}

export function validateUploadedFileSignature(file: Express.Multer.File): void {
  const ext = getFileExtension(file.originalname);
  const mime = file.mimetype;
  const buffer = file.buffer;

  if (!buffer || buffer.length === 0) {
    throw new AppError('Uploaded file is empty', 400);
  }

  const isValid =
    ((mime === 'application/pdf' || ext === 'pdf') && isPdfBuffer(buffer)) ||
    ((mime === 'image/png' || ext === 'png') && isPngBuffer(buffer)) ||
    ((mime === 'image/jpeg' || mime === 'image/jpg' || ext === 'jpg' || ext === 'jpeg') && isJpegBuffer(buffer)) ||
    ((mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === 'docx') && isZipLikeBuffer(buffer));

  if (!isValid) {
    throw new AppError('File content does not match the declared file type', 400);
  }
}

export function sanitizeUploadFileName(fileName: string): string {
  const base = String(fileName || 'document')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[<>:\"/\\\\|?*]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  return base.slice(0, 200) || 'document';
}
