/**
 * Rate limiting middleware for email sending
 * Prevents abuse by limiting email sending frequency
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (for production, consider Redis)
const rateLimitStore: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}, 5 * 60 * 1000);

/**
 * Rate limit configuration
 */
const RATE_LIMITS = {
  // Per IP address
  perIP: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // Max 10 emails per 15 minutes per IP
  },
  // Per email address
  perEmail: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // Max 5 emails per hour per email address
  },
};

/**
 * Gets client IP address from request
 */
function getClientIP(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * Checks if rate limit is exceeded
 */
function checkRateLimit(key: string, limit: { windowMs: number; maxRequests: number }): boolean {
  const now = Date.now();
  const entry = rateLimitStore[key];

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired one
    rateLimitStore[key] = {
      count: 1,
      resetTime: now + limit.windowMs,
    };
    return false; // Not exceeded
  }

  // Increment count
  entry.count++;

  // Check if exceeded
  if (entry.count > limit.maxRequests) {
    return true; // Exceeded
  }

  return false; // Not exceeded
}

/**
 * Rate limit middleware for email sending endpoints
 */
export const emailRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = getClientIP(req);
  
  // Check IP-based rate limit
  if (checkRateLimit(`ip:${clientIP}`, RATE_LIMITS.perIP)) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
    });
  }

  // Check email-based rate limit (if email is in request body)
  const email = req.body?.requesterEmail || req.body?.email;
  if (email && typeof email === 'string') {
    if (checkRateLimit(`email:${email.toLowerCase()}`, RATE_LIMITS.perEmail)) {
      return res.status(429).json({
        error: 'Too many requests for this email address. Please try again later.',
      });
    }
  }

  next();
};

/**
 * Gets rate limit info for debugging (admin only)
 */
export function getRateLimitInfo(key: string): { count: number; resetTime: number } | null {
  return rateLimitStore[key] || null;
}

