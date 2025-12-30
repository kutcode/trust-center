import request from 'supertest';
import express from 'express';
import { supabase } from '../../server';
import accessRoutes from '../access';
import bodyParser from 'body-parser';

// Mock Supabase client
jest.mock('../../server', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    single: jest.fn(),
                })),
            })),
            update: jest.fn(() => ({
                eq: jest.fn(),
            })),
            insert: jest.fn(),
        })),
    },
}));

// Setup Express app for testing
const app = express();
app.use(bodyParser.json());
app.use('/api/access', accessRoutes);

describe('Document Access Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/access/:token', () => {
        it('should return 404 for invalid token', async () => {
            // Mock Supabase response for invalid token
            (supabase.from as any).mockImplementation(() => ({
                from: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
            }));

            const res = await request(app).get('/api/access/invalid-token');
            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Invalid or expired link');
        });

        // Add more tests here...
    });
});
