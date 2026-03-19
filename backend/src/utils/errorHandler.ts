import { Response } from 'express';

export { AppError } from '../middleware/errorHandler';

export const handleError = (res: Response, error: any, message: string = 'Internal server error') => {
    const status = error?.status || 500;
    console.error(`[${new Date().toISOString()}] ${message}:`, {
        error: error.message || message,
        status,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
    res.status(status).json({ error: error.message || message });
};
