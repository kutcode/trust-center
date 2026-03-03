import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

const uploadAttemptsByAdmin = new Map<string, number[]>();

function parseAdminAllowlist(): string[] {
  const raw = String(process.env.DOCUMENT_UPLOAD_ADMIN_EMAIL_ALLOWLIST || '').trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isDocumentUploadsEnabled(): boolean {
  const raw = String(process.env.DOCUMENT_UPLOADS_ENABLED || 'true').toLowerCase();
  return raw !== 'false' && raw !== '0' && raw !== 'no';
}

function isDemoUploadAllowed(): boolean {
  const raw = String(process.env.DEMO_ALLOW_DOCUMENT_UPLOADS || 'false').toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'yes';
}

function getPerMinuteLimit(): number {
  const n = Number(process.env.DOCUMENT_UPLOADS_PER_MINUTE || '20');
  if (!Number.isFinite(n)) return 20;
  return Math.max(1, Math.min(200, Math.floor(n)));
}

function enforceUploadRateLimit(adminId: string, perMinuteLimit: number): boolean {
  const now = Date.now();
  const windowStart = now - 60_000;
  const existing = uploadAttemptsByAdmin.get(adminId) || [];
  const recent = existing.filter((ts) => ts >= windowStart);

  if (recent.length >= perMinuteLimit) {
    uploadAttemptsByAdmin.set(adminId, recent);
    return false;
  }

  recent.push(now);
  uploadAttemptsByAdmin.set(adminId, recent);
  return true;
}

export function enforceDocumentUploadPolicy(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.admin) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required for uploads' });
  }

  if (!isDocumentUploadsEnabled()) {
    return res.status(403).json({
      error: 'Document uploads are disabled by environment policy',
    });
  }

  if (process.env.DEMO_MODE === 'true' && !isDemoUploadAllowed()) {
    return res.status(403).json({
      error: 'Document uploads are disabled in demo mode',
    });
  }

  const allowlist = parseAdminAllowlist();
  if (allowlist.length > 0) {
    const email = String(req.admin.email || '').toLowerCase();
    if (!allowlist.includes(email)) {
      return res.status(403).json({
        error: 'Your account is not allowed to upload documents',
      });
    }
  }

  const perMinuteLimit = getPerMinuteLimit();
  if (!enforceUploadRateLimit(req.admin.id, perMinuteLimit)) {
    return res.status(429).json({
      error: `Upload rate limit exceeded (${perMinuteLimit}/minute). Please wait and try again.`,
    });
  }

  next();
}
