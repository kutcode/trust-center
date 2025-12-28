import { Response } from 'express';

export const handleError = (res: Response, error: any, message: string = 'Internal server error') => {
    console.error(`${message}:`, error);
    res.status(500).json({ error: error.message || message });
};
