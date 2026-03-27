import path from 'path';

const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';

/**
 * Resolves a file URL against the uploads directory and ensures the result
 * stays within that directory, preventing path traversal attacks.
 */
export function resolveUploadPath(fileUrl: string): string {
  const base = path.resolve(UPLOADS_DIR);
  const resolved = path.resolve(base, fileUrl);
  if (!resolved.startsWith(base + path.sep) && resolved !== base) {
    throw new Error('Invalid file path');
  }
  return resolved;
}
