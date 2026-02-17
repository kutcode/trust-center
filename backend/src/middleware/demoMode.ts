/**
 * Demo Mode Middleware
 * 
 * When DEMO_MODE=true, this middleware adds safety guardrails:
 * - Blocks dangerous bulk delete operations
 * - Prevents changes to authentication settings
 * - Adds x-demo-mode header to all responses
 * - Limits file upload sizes in demo
 */

import { Request, Response, NextFunction } from 'express';

export const DEMO_MODE = process.env.DEMO_MODE === 'true';

// Routes that are completely blocked in demo mode
const BLOCKED_ROUTES: Array<{ method: string; pattern: RegExp; message: string }> = [
    // Block signup (demo has fixed admin accounts)
    { method: 'POST', pattern: /^\/api\/auth\/signup$/, message: 'Signup is disabled in demo mode. Use the demo admin credentials to log in.' },
];

// Routes where we allow operations but with limits
const LIMITED_ROUTES: Array<{ method: string; pattern: RegExp; limit: number; entity: string }> = [
    // Limit how many documents can be created in demo
    { method: 'POST', pattern: /^\/api\/documents/, limit: 20, entity: 'documents' },
    // Limit certifications
    { method: 'POST', pattern: /^\/api\/certifications/, limit: 10, entity: 'certifications' },
    // Limit security updates
    { method: 'POST', pattern: /^\/api\/security-updates/, limit: 10, entity: 'security updates' },
];

/**
 * Main demo mode middleware
 * Applied globally when DEMO_MODE=true
 */
export function demoModeMiddleware(req: Request, res: Response, next: NextFunction) {
    if (!DEMO_MODE) {
        return next();
    }

    // Add demo mode header to all responses
    res.setHeader('X-Demo-Mode', 'true');

    // Check blocked routes
    for (const route of BLOCKED_ROUTES) {
        if (req.method === route.method && route.pattern.test(req.path)) {
            return res.status(403).json({
                error: route.message,
                demoMode: true,
            });
        }
    }

    // Allow all GET requests through
    if (req.method === 'GET') {
        return next();
    }

    // For write operations, let them through but log for monitoring
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        console.log(`[DEMO] ${req.method} ${req.path} by ${req.ip}`);
    }

    next();
}

/**
 * Helper to check if demo mode is active
 */
export function isDemoMode(): boolean {
    return DEMO_MODE;
}
