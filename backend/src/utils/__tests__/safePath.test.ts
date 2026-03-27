import path from 'path';

// Set UPLOADS_DIR before importing so the module picks it up
const TEST_UPLOADS_DIR = '/app/uploads';
process.env.UPLOADS_DIR = TEST_UPLOADS_DIR;

import { resolveUploadPath } from '../../utils/safePath';

describe('resolveUploadPath', () => {
  it('should resolve a simple filename within the uploads directory', () => {
    const result = resolveUploadPath('documents/report.pdf');
    expect(result).toBe(path.resolve(TEST_UPLOADS_DIR, 'documents/report.pdf'));
  });

  it('should resolve a nested path within the uploads directory', () => {
    const result = resolveUploadPath('documents/2025/q1/report.pdf');
    expect(result).toBe(path.resolve(TEST_UPLOADS_DIR, 'documents/2025/q1/report.pdf'));
  });

  it('should throw on path traversal with ../', () => {
    expect(() => resolveUploadPath('../etc/passwd')).toThrow('Invalid file path');
  });

  it('should throw on path traversal with nested ../', () => {
    expect(() => resolveUploadPath('documents/../../etc/shadow')).toThrow('Invalid file path');
  });

  it('should throw on absolute path outside uploads dir', () => {
    expect(() => resolveUploadPath('/etc/passwd')).toThrow('Invalid file path');
  });

  it('should throw when resolved path escapes uploads dir via encoded traversal', () => {
    expect(() => resolveUploadPath('documents/../../../etc/passwd')).toThrow('Invalid file path');
  });

  it('should allow paths that stay within the uploads directory', () => {
    const result = resolveUploadPath('documents/../documents/report.pdf');
    expect(result).toBe(path.resolve(TEST_UPLOADS_DIR, 'documents/report.pdf'));
  });
});
